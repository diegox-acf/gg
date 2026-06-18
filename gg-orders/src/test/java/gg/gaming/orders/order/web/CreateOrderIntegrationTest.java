package gg.gaming.orders.order.web;

import static org.assertj.core.api.Assertions.assertThat;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.ArgumentMatchers.anyLong;
import static org.mockito.Mockito.doThrow;
import static org.mockito.Mockito.when;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.post;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.jsonPath;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.status;

import gg.gaming.orders.TestcontainersConfiguration;
import gg.gaming.orders.catalog.CatalogClient;
import gg.gaming.orders.catalog.CatalogProduct;
import gg.gaming.orders.catalog.CatalogProductNotFoundException;
import gg.gaming.orders.inventory.InsufficientStockException;
import gg.gaming.orders.inventory.InventoryClient;
import gg.gaming.orders.order.OrderRepository;
import gg.gaming.orders.outbox.OutboxRepository;
import gg.gaming.orders.payment.StripePaymentGateway;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.autoconfigure.web.servlet.AutoConfigureMockMvc;
import org.springframework.boot.test.context.SpringBootTest;
import org.springframework.context.annotation.Import;
import org.springframework.http.MediaType;
import org.springframework.test.context.bean.override.mockito.MockitoBean;
import org.springframework.test.web.servlet.MockMvc;
import org.springframework.transaction.annotation.Transactional;

/**
 * Full HTTP→service→Postgres flow including the saga; Catalog and the Inventory client are mocked
 * (the saga's reserve hop is unit-covered in SagaOrchestratorTest). Each test rolls back.
 */
@Import(TestcontainersConfiguration.class)
@SpringBootTest
@AutoConfigureMockMvc
@Transactional
class CreateOrderIntegrationTest {

  @Autowired private MockMvc mvc;
  @Autowired private OrderRepository orders;
  @Autowired private OutboxRepository outbox;
  @MockitoBean private CatalogClient catalog;
  @MockitoBean private InventoryClient inventory; // reserve() succeeds by default (void no-op)
  @MockitoBean private StripePaymentGateway payments; // no real Stripe in tests

  private static final String BODY =
      """
      {"items":[{"product_id":1,"quantity":2}],
       "shipping":{"name":"Jane","line1":"1 Main St","city":"LA","state":"CA",
                   "postal_code":"90001","country":"US"}}
      """;

  @org.junit.jupiter.api.BeforeEach
  void stubPaymentIntent() {
    // Default: the saga's PAYING step gets a PaymentIntent. Tests that fail before payment
    // (insufficient stock, unknown product) simply never reach this stub.
    when(payments.createPaymentIntent(anyLong(), anyLong(), any(), any()))
        .thenReturn(new StripePaymentGateway.PaymentIntentResult("pi_default", "secret_default"));
  }

  @Test
  void createsOrderReservesAndCreatesPaymentIntentWithSnapshotPrices() throws Exception {
    when(catalog.getProduct(1L))
        .thenReturn(new CatalogProduct(1, "SKU-1", "RTX 5090", 10_000, "USD"));
    when(payments.createPaymentIntent(anyLong(), anyLong(), any(), any()))
        .thenReturn(new StripePaymentGateway.PaymentIntentResult("pi_test_123", "pi_test_secret"));

    mvc.perform(
            post("/orders")
                .header("X-User-Id", "user-42")
                .header("Idempotency-Key", "int-key-1")
                .contentType(MediaType.APPLICATION_JSON)
                .content(BODY))
        .andExpect(status().isCreated())
        // Reserved (mock) + PaymentIntent created → order rests in PAYING; client_secret returned
        // for the browser to confirm (ADR-021); terminal event awaits the webhook.
        .andExpect(jsonPath("$.order.status").value("PAYING"))
        .andExpect(jsonPath("$.client_secret").value("pi_test_secret"))
        .andExpect(jsonPath("$.order.order_number").exists())
        .andExpect(jsonPath("$.order.subtotal_cents").value(20_000))
        .andExpect(jsonPath("$.order.tax_cents").value(1_600))
        .andExpect(jsonPath("$.order.shipping_cents").value(999))
        .andExpect(jsonPath("$.order.total_cents").value(22_599))
        .andExpect(jsonPath("$.order.items[0].sku").value("SKU-1"))
        .andExpect(jsonPath("$.order.items[0].name").value("RTX 5090"));

    assertThat(orders.findByIdempotencyKey("int-key-1")).isPresent();
    assertThat(outbox.count()).isEqualTo(1); // OrderPlaced only — terminal event awaits the webhook
  }

  @Test
  void insufficientStockFailsTheOrderAndEmitsOrderFailed() throws Exception {
    when(catalog.getProduct(1L))
        .thenReturn(new CatalogProduct(1, "SKU-1", "RTX 5090", 10_000, "USD"));
    doThrow(new InsufficientStockException(0L)).when(inventory).reserve(anyLong(), any());

    mvc.perform(
            post("/orders")
                .header("X-User-Id", "user-43")
                .header("Idempotency-Key", "int-key-oos")
                .contentType(MediaType.APPLICATION_JSON)
                .content(BODY))
        .andExpect(status().isCreated())
        .andExpect(jsonPath("$.order.status").value("FAILED")) // reserve rejected → no payment
        .andExpect(jsonPath("$.client_secret").value(org.hamcrest.Matchers.nullValue()));

    assertThat(outbox.count()).isEqualTo(2); // OrderPlaced + OrderFailed
  }

  @Test
  void idempotentReplayReturnsSameOrder() throws Exception {
    when(catalog.getProduct(1L))
        .thenReturn(new CatalogProduct(1, "SKU-1", "RTX 5090", 10_000, "USD"));

    for (int i = 0; i < 2; i++) {
      mvc.perform(
              post("/orders")
                  .header("X-User-Id", "user-7")
                  .header("Idempotency-Key", "int-key-replay")
                  .contentType(MediaType.APPLICATION_JSON)
                  .content(BODY))
          .andExpect(status().isCreated());
    }

    assertThat(orders.findByUserIdOrderByCreatedAtDesc("user-7")).hasSize(1);
  }

  @Test
  void missingUserIdHeaderIsBadRequest() throws Exception {
    when(catalog.getProduct(anyLong()))
        .thenReturn(new CatalogProduct(1, "SKU-1", "RTX 5090", 10_000, "USD"));

    mvc.perform(
            post("/orders")
                .header("Idempotency-Key", "k")
                .contentType(MediaType.APPLICATION_JSON)
                .content(BODY))
        .andExpect(status().isBadRequest());
  }

  @Test
  void unknownProductIsUnprocessable() throws Exception {
    when(catalog.getProduct(1L)).thenThrow(new CatalogProductNotFoundException(1));

    mvc.perform(
            post("/orders")
                .header("X-User-Id", "user-9")
                .header("Idempotency-Key", "k-unknown")
                .contentType(MediaType.APPLICATION_JSON)
                .content(BODY))
        .andExpect(status().isUnprocessableEntity());
  }
}
