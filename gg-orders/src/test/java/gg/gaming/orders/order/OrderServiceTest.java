package gg.gaming.orders.order;

import static org.assertj.core.api.Assertions.assertThat;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.Mockito.never;
import static org.mockito.Mockito.verify;
import static org.mockito.Mockito.verifyNoInteractions;
import static org.mockito.Mockito.when;

import com.fasterxml.jackson.databind.ObjectMapper;
import gg.gaming.orders.catalog.CatalogClient;
import gg.gaming.orders.catalog.CatalogProduct;
import gg.gaming.orders.common.OrderStatus;
import gg.gaming.orders.config.OrderProperties;
import gg.gaming.orders.outbox.OutboxEvent;
import gg.gaming.orders.outbox.OutboxRepository;
import java.util.List;
import java.util.Optional;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.ArgumentCaptor;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;
import org.springframework.test.util.ReflectionTestUtils;

@ExtendWith(MockitoExtension.class)
class OrderServiceTest {

  @Mock private OrderRepository orders;
  @Mock private OutboxRepository outbox;
  @Mock private CatalogClient catalog;
  @Mock private OrderNumberGenerator orderNumbers;

  private OrderService newService() {
    return new OrderService(
        orders, outbox, catalog, orderNumbers, new OrderProperties(800, 999), new ObjectMapper());
  }

  private static CreateOrderCommand command(List<CreateOrderCommand.Item> items, String key) {
    return new CreateOrderCommand(
        "user-1",
        key,
        items,
        new CreateOrderCommand.ShippingAddress("Jane", "1 St", null, "City", "CA", "90001", "US"));
  }

  @Test
  void createsOrderWithSnapshottedPricesTaxAndOutbox() {
    when(orders.findByIdempotencyKey("k1")).thenReturn(Optional.empty());
    when(orderNumbers.next()).thenReturn("GMR-2026-00001");
    when(catalog.getProduct(1)).thenReturn(new CatalogProduct(1, "SKU-1", "GPU", 10_000, "USD"));
    when(catalog.getProduct(2)).thenReturn(new CatalogProduct(2, "SKU-2", "CPU", 5_000, "USD"));
    when(orders.saveAndFlush(any(Order.class)))
        .thenAnswer(
            inv -> {
              Order o = inv.getArgument(0);
              ReflectionTestUtils.setField(o, "id", 42L);
              return o;
            });

    Order result =
        newService()
            .createOrder(
                command(
                    List.of(new CreateOrderCommand.Item(1, 2), new CreateOrderCommand.Item(2, 1)),
                    "k1"));

    assertThat(result.getStatus()).isEqualTo(OrderStatus.PENDING);
    assertThat(result.getOrderNumber()).isEqualTo("GMR-2026-00001");
    assertThat(result.getSubtotalCents()).isEqualTo(25_000); // 10000*2 + 5000*1
    assertThat(result.getTaxCents()).isEqualTo(2_000); // 8% of 25000
    assertThat(result.getShippingCents()).isEqualTo(999);
    assertThat(result.getTotalCents()).isEqualTo(27_999);
    assertThat(result.getLineItems()).hasSize(2);
    assertThat(result.getLineItems().get(0).getSku()).isEqualTo("SKU-1");
    assertThat(result.getLineItems().get(0).getNameSnapshot()).isEqualTo("GPU");
    assertThat(result.getLineItems().get(0).getTotalCents()).isEqualTo(20_000);

    ArgumentCaptor<OutboxEvent> event = ArgumentCaptor.forClass(OutboxEvent.class);
    verify(outbox).save(event.capture());
    assertThat(ReflectionTestUtils.getField(event.getValue(), "eventType"))
        .isEqualTo("OrderPlaced");
    assertThat(ReflectionTestUtils.getField(event.getValue(), "topic"))
        .isEqualTo("orders.order-created");
    assertThat(ReflectionTestUtils.getField(event.getValue(), "aggregateType")).isEqualTo("Order");
  }

  @Test
  void idempotentReplayReturnsExistingWithoutPricingOrPersisting() {
    Order existing = new Order("GMR-2026-00009", "user-1", "k2", "USD");
    when(orders.findByIdempotencyKey("k2")).thenReturn(Optional.of(existing));

    Order result =
        newService().createOrder(command(List.of(new CreateOrderCommand.Item(1, 1)), "k2"));

    assertThat(result).isSameAs(existing);
    verifyNoInteractions(catalog);
    verifyNoInteractions(outbox);
    verify(orders, never()).saveAndFlush(any());
  }

  @Test
  void rejectsEmptyOrder() {
    org.junit.jupiter.api.Assertions.assertThrows(
        InvalidOrderException.class, () -> newService().createOrder(command(List.of(), "k3")));
    verifyNoInteractions(catalog);
  }
}
