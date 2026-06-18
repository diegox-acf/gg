package gg.gaming.orders.saga;

import static org.assertj.core.api.Assertions.assertThat;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.ArgumentMatchers.anyLong;
import static org.mockito.ArgumentMatchers.eq;
import static org.mockito.Mockito.doThrow;
import static org.mockito.Mockito.never;
import static org.mockito.Mockito.verify;
import static org.mockito.Mockito.when;

import com.fasterxml.jackson.databind.ObjectMapper;
import gg.gaming.orders.common.OrderStatus;
import gg.gaming.orders.inventory.InsufficientStockException;
import gg.gaming.orders.inventory.InventoryClient;
import gg.gaming.orders.order.Order;
import gg.gaming.orders.order.OrderRepository;
import gg.gaming.orders.outbox.OutboxEvent;
import gg.gaming.orders.outbox.OutboxRepository;
import gg.gaming.orders.payment.PaymentGatewayException;
import gg.gaming.orders.payment.StripePaymentGateway;
import java.util.Optional;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.mockito.ArgumentCaptor;
import org.mockito.Mockito;
import org.springframework.test.util.ReflectionTestUtils;
import org.springframework.transaction.PlatformTransactionManager;
import org.springframework.transaction.support.SimpleTransactionStatus;

/**
 * State-machine behaviour of the orchestrator with all collaborators mocked. The {@link
 * org.springframework.transaction.support.TransactionTemplate} runs its callbacks inline against a
 * mock transaction manager, so the saga's step transitions mutate the in-memory order directly.
 */
class SagaOrchestratorTest {

  private OrderRepository orders;
  private OutboxRepository outbox;
  private InventoryClient inventory;
  private StripePaymentGateway payments;
  private SagaOrchestrator saga;
  private Order order;

  @BeforeEach
  void setUp() {
    orders = Mockito.mock(OrderRepository.class);
    outbox = Mockito.mock(OutboxRepository.class);
    inventory = Mockito.mock(InventoryClient.class);
    payments = Mockito.mock(StripePaymentGateway.class);
    PlatformTransactionManager txManager = Mockito.mock(PlatformTransactionManager.class);
    when(txManager.getTransaction(any())).thenReturn(new SimpleTransactionStatus());

    saga = new SagaOrchestrator(orders, outbox, inventory, payments, new ObjectMapper(), txManager);

    order = new Order("GMR-2026-00001", "user-1", "key-1", "USD");
    order.setAmounts(20_000, 1_600, 999);
    ReflectionTestUtils.setField(order, "id", 7L); // entity isn't persisted in a unit test
    when(orders.findWithItemsById(7L)).thenReturn(Optional.of(order));
    when(orders.findById(7L)).thenReturn(Optional.of(order));
    when(payments.createPaymentIntent(anyLong(), anyLong(), any(), any()))
        .thenReturn(new StripePaymentGateway.PaymentIntentResult("pi_test", "pi_test_secret"));
  }

  @Test
  void happyPath_reservesThenCreatesIntent_andReturnsClientSecret() {
    CheckoutResult result = saga.begin(7L);

    // The saga reserves, creates the (unconfirmed) PaymentIntent, and stops at PAYING — the
    // browser confirms the card; the terminal transition is the webhook's job (no outbox yet).
    assertThat(order.getStatus()).isEqualTo(OrderStatus.PAYING);
    assertThat(order.getPaymentIntentId()).isEqualTo("pi_test");
    assertThat(result.status()).isEqualTo(OrderStatus.PAYING);
    assertThat(result.clientSecret()).isEqualTo("pi_test_secret");
    verify(inventory).reserve(eq(7L), any());
    verify(payments).createPaymentIntent(eq(7L), eq(22_599L), eq("USD"), any());
    verify(outbox, never()).save(any());
  }

  @Test
  void confirmPayment_movesPayingToConfirmed_andEmitsOrderConfirmed() {
    order.setStatus(OrderStatus.PAYING);

    saga.confirmPayment(7L);

    assertThat(order.getStatus()).isEqualTo(OrderStatus.CONFIRMED);
    assertThat(savedOutboxEvent().getEventType()).isEqualTo("OrderConfirmed");
  }

  @Test
  void failPayment_movesPayingToFailed_andEmitsOrderFailed() {
    order.setStatus(OrderStatus.PAYING);

    saga.failPayment(7L, "payment_failed:card_declined");

    assertThat(order.getStatus()).isEqualTo(OrderStatus.FAILED);
    assertThat(savedOutboxEvent().getEventType()).isEqualTo("OrderFailed");
  }

  @Test
  void insufficientStock_failsOrder_andEmitsOrderFailed_withoutPaying() {
    doThrow(new InsufficientStockException(7L)).when(inventory).reserve(anyLong(), any());

    CheckoutResult result = saga.begin(7L);

    assertThat(order.getStatus()).isEqualTo(OrderStatus.FAILED);
    assertThat(result.status()).isEqualTo(OrderStatus.FAILED);
    assertThat(result.clientSecret()).isNull();
    verify(payments, never()).createPaymentIntent(anyLong(), anyLong(), any(), any());
    assertThat(savedOutboxEvent().getEventType()).isEqualTo("OrderFailed");
  }

  @Test
  void paymentGatewayError_failsOrder_andEmitsOrderFailed() {
    when(payments.createPaymentIntent(anyLong(), anyLong(), any(), any()))
        .thenThrow(new PaymentGatewayException("stripe down", null));

    CheckoutResult result = saga.begin(7L);

    assertThat(order.getStatus()).isEqualTo(OrderStatus.FAILED);
    assertThat(result.clientSecret()).isNull();
    assertThat(savedOutboxEvent().getEventType()).isEqualTo("OrderFailed");
  }

  @Test
  void recover_payingWithSucceededIntent_confirms() {
    order.setStatus(OrderStatus.PAYING);
    order.setPaymentIntentId("pi_x");
    when(payments.getPaymentStatus("pi_x")).thenReturn("succeeded");

    saga.recover(7L);

    assertThat(order.getStatus()).isEqualTo(OrderStatus.CONFIRMED);
    assertThat(savedOutboxEvent().getEventType()).isEqualTo("OrderConfirmed");
  }

  @Test
  void recover_payingWithDeclinedIntent_fails() {
    order.setStatus(OrderStatus.PAYING);
    order.setPaymentIntentId("pi_x");
    when(payments.getPaymentStatus("pi_x")).thenReturn("requires_payment_method");

    saga.recover(7L);

    assertThat(order.getStatus()).isEqualTo(OrderStatus.FAILED);
    assertThat(savedOutboxEvent().getEventType()).isEqualTo("OrderFailed");
  }

  @Test
  void recover_payingStillProcessing_staysPaying() {
    order.setStatus(OrderStatus.PAYING);
    order.setPaymentIntentId("pi_x");
    when(payments.getPaymentStatus("pi_x")).thenReturn("processing");

    saga.recover(7L);

    assertThat(order.getStatus()).isEqualTo(OrderStatus.PAYING);
    verify(outbox, never()).save(any());
  }

  @Test
  void recover_pendingOrder_resumesReserveAndPay() {
    // No payment intent yet → recovery re-enters begin(): reserve (mock) + create intent → PAYING.
    saga.recover(7L);

    assertThat(order.getStatus()).isEqualTo(OrderStatus.PAYING);
    assertThat(order.getPaymentIntentId()).isEqualTo("pi_test");
    verify(inventory).reserve(eq(7L), any());
  }

  @Test
  void terminalOrder_isANoOp() {
    order.setStatus(OrderStatus.CONFIRMED);

    CheckoutResult result = saga.begin(7L);

    assertThat(result.status()).isEqualTo(OrderStatus.CONFIRMED);
    verify(inventory, never()).reserve(anyLong(), any());
    verify(outbox, never()).save(any());
  }

  private OutboxEvent savedOutboxEvent() {
    ArgumentCaptor<OutboxEvent> captor = ArgumentCaptor.forClass(OutboxEvent.class);
    verify(outbox).save(captor.capture());
    return captor.getValue();
  }
}
