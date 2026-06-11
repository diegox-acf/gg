package gg.gaming.orders.order;

import static org.assertj.core.api.Assertions.assertThat;
import static org.mockito.Mockito.when;

import gg.gaming.orders.TestcontainersConfiguration;
import gg.gaming.orders.catalog.CatalogClient;
import gg.gaming.orders.catalog.CatalogProduct;
import gg.gaming.orders.outbox.OutboxRepository;
import java.util.ArrayList;
import java.util.List;
import java.util.Set;
import java.util.concurrent.Callable;
import java.util.concurrent.ConcurrentHashMap;
import java.util.concurrent.CountDownLatch;
import java.util.concurrent.ExecutorService;
import java.util.concurrent.Executors;
import java.util.concurrent.Future;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.context.SpringBootTest;
import org.springframework.context.annotation.Import;
import org.springframework.test.context.TestPropertySource;
import org.springframework.test.context.bean.override.mockito.MockitoBean;

/**
 * Proves the idempotency-key race recovery against a real Postgres: many concurrent creates with
 * the same key yield exactly one order, every caller gets that same order, and none throws (the
 * losers' transactions roll back and re-read the winner in a fresh transaction). Runs in its own
 * context/container ({@code @TestPropertySource}) so its committed rows don't leak into the
 * transactional {@code CreateOrderIntegrationTest}.
 */
@Import(TestcontainersConfiguration.class)
@SpringBootTest
@TestPropertySource(properties = "test.isolation=order-race")
class OrderRaceConcurrencyTest {

  @Autowired private OrderService service;
  @Autowired private OrderRepository orders;
  @Autowired private OutboxRepository outbox;
  @MockitoBean private CatalogClient catalog;

  @Test
  void concurrentDuplicateKeyCreatesExactlyOneOrder() throws Exception {
    when(catalog.getProduct(1L)).thenReturn(new CatalogProduct(1, "SKU-1", "GPU", 10_000, "USD"));

    int threads = 8;
    CreateOrderCommand command =
        new CreateOrderCommand(
            "race-user",
            "race-key",
            List.of(new CreateOrderCommand.Item(1, 1)),
            new CreateOrderCommand.ShippingAddress(
                "Jane", "1 St", null, "LA", "CA", "90001", "US"));

    ExecutorService pool = Executors.newFixedThreadPool(threads);
    CountDownLatch start = new CountDownLatch(1);
    Set<Long> returnedIds = ConcurrentHashMap.newKeySet();
    try {
      List<Future<Long>> futures = new ArrayList<>();
      for (int i = 0; i < threads; i++) {
        futures.add(
            pool.submit(
                (Callable<Long>)
                    () -> {
                      start.await();
                      return service.createOrder(command).getId();
                    }));
      }
      start.countDown(); // release all threads at once
      for (Future<Long> f : futures) {
        returnedIds.add(f.get()); // rethrows if any thread failed
      }
    } finally {
      pool.shutdownNow();
    }

    assertThat(returnedIds).hasSize(1); // every caller got the same order
    assertThat(orders.findByUserIdOrderByCreatedAtDesc("race-user")).hasSize(1);
    assertThat(outbox.count()).isEqualTo(1);
  }
}
