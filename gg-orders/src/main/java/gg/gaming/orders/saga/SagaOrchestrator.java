package gg.gaming.orders.saga;

import static gg.gaming.orders.common.OrderStatus.CONFIRMED;
import static gg.gaming.orders.common.OrderStatus.FAILED;
import static gg.gaming.orders.common.OrderStatus.PAYING;
import static gg.gaming.orders.common.OrderStatus.PENDING;
import static gg.gaming.orders.common.OrderStatus.RESERVING;

import com.fasterxml.jackson.core.JsonProcessingException;
import com.fasterxml.jackson.databind.ObjectMapper;
import gg.gaming.orders.common.OrderStatus;
import gg.gaming.orders.common.Tracing;
import gg.gaming.orders.inventory.InsufficientStockException;
import gg.gaming.orders.inventory.InventoryClient;
import gg.gaming.orders.inventory.InventoryUnavailableException;
import gg.gaming.orders.order.Order;
import gg.gaming.orders.order.OrderRepository;
import gg.gaming.orders.outbox.OutboxEvent;
import gg.gaming.orders.outbox.OutboxRepository;
import gg.gaming.orders.payment.PaymentGatewayException;
import gg.gaming.orders.payment.StripePaymentGateway;
import java.time.Instant;
import java.util.EnumMap;
import java.util.EnumSet;
import java.util.LinkedHashMap;
import java.util.Map;
import java.util.Set;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.stereotype.Service;
import org.springframework.transaction.PlatformTransactionManager;
import org.springframework.transaction.support.TransactionTemplate;

/**
 * Drives the checkout saga (ADR-018, UC-05): {@code PENDING → RESERVING → PAYING → CONFIRMED |
 * FAILED}. Orders is the orchestrator; stock is reserved over synchronous REST, and the terminal
 * outcome is emitted as an {@code OrderConfirmed}/{@code OrderFailed} outbox event that Inventory
 * consumes to commit or release the reservation (compensation).
 *
 * <p>Each status transition is its own short transaction; the REST reserve happens between
 * transactions (never inside one). {@link #run} is <strong>resumable and idempotent</strong>: it
 * skips already-completed steps based on the persisted status, re-running a terminal order is a
 * no-op, and the reserve call is idempotent in Inventory — so the Milestone-D3 recovery worker can
 * call it to resume a crashed saga.
 *
 * <p>Payment is <strong>asynchronous</strong> (ADR-020): at PAYING the saga creates+confirms a
 * Stripe PaymentIntent and stops. The order rests in PAYING until Stripe delivers a webhook, which
 * calls {@link #confirmPayment}/{@link #failPayment} to make the terminal transition. {@code run}
 * therefore returns with the order in PAYING on the happy path, not CONFIRMED.
 */
@Service
public class SagaOrchestrator {

  private static final Logger log = LoggerFactory.getLogger(SagaOrchestrator.class);
  private static final String ORDERS_TOPIC = "orders.order-created";

  /** Allowed forward transitions of the saga state machine. */
  private static final Map<OrderStatus, Set<OrderStatus>> ALLOWED =
      new EnumMap<>(OrderStatus.class);

  static {
    ALLOWED.put(PENDING, EnumSet.of(RESERVING, FAILED));
    ALLOWED.put(RESERVING, EnumSet.of(PAYING, FAILED));
    ALLOWED.put(PAYING, EnumSet.of(CONFIRMED, FAILED));
    ALLOWED.put(CONFIRMED, EnumSet.noneOf(OrderStatus.class));
    ALLOWED.put(FAILED, EnumSet.noneOf(OrderStatus.class));
  }

  private final OrderRepository orders;
  private final OutboxRepository outbox;
  private final InventoryClient inventory;
  private final StripePaymentGateway payments;
  private final ObjectMapper objectMapper;
  private final TransactionTemplate tx;

  public SagaOrchestrator(
      OrderRepository orders,
      OutboxRepository outbox,
      InventoryClient inventory,
      StripePaymentGateway payments,
      ObjectMapper objectMapper,
      PlatformTransactionManager txManager) {
    this.orders = orders;
    this.outbox = outbox;
    this.inventory = inventory;
    this.payments = payments;
    this.objectMapper = objectMapper;
    this.tx = new TransactionTemplate(txManager);
  }

  /** Advances the order toward a terminal state, resuming from whatever status it is in. */
  public void run(long orderId) {
    Order order =
        orders
            .findWithItemsById(orderId)
            .orElseThrow(() -> new IllegalStateException("order not found: " + orderId));

    if (isTerminal(order.getStatus())) {
      return; // already CONFIRMED/FAILED — nothing to do (idempotent re-entry)
    }

    // Step 1 — reserve stock (PENDING/RESERVING). Reserve is idempotent, so re-entry is safe.
    if (order.getStatus() == PENDING || order.getStatus() == RESERVING) {
      transition(orderId, RESERVING);
      try {
        inventory.reserve(orderId, reserveItems(order));
      } catch (InsufficientStockException e) {
        log.info("order {} FAILED — insufficient stock", orderId);
        finishFailed(orderId, "insufficient_stock");
        return;
      } catch (InventoryUnavailableException e) {
        // D3 recovery may resume; for D1 we fail the order (no reservation was made, so no
        // compensation is needed).
        log.warn("order {} FAILED — inventory unavailable", orderId, e);
        finishFailed(orderId, "inventory_unavailable");
        return;
      }
      transition(orderId, PAYING);
    }

    // Step 2 — initiate payment (PAYING). Create+confirm a PaymentIntent, then stop: the terminal
    // transition is made later by the Stripe webhook (confirmPayment/failPayment). Re-entry after a
    // PaymentIntent already exists is a no-op — the webhook owns the outcome from here.
    Order paying = managed(orderId);
    if (paying.getStatus() == PAYING && paying.getPaymentIntentId() == null) {
      initiatePayment(paying);
    }
  }

  /**
   * PAYING step: create+confirm the PaymentIntent and persist its id, or fail on a gateway error.
   */
  private void initiatePayment(Order order) {
    long orderId = order.getId();
    try {
      String paymentIntentId =
          payments.createAndConfirmPayment(
              orderId, order.getTotalCents(), order.getCurrency(), order.getOrderNumber());
      tx.executeWithoutResult(status -> managed(orderId).setPaymentIntentId(paymentIntentId));
      log.info("order {} PAYING — awaiting Stripe webhook (intent {})", orderId, paymentIntentId);
    } catch (PaymentGatewayException e) {
      // No PaymentIntent was created, so no webhook will come — fail the order now.
      log.warn("order {} FAILED — payment gateway error", orderId, e);
      finishFailed(orderId, "payment_error");
    }
  }

  /**
   * Webhook entry point for a successful payment ({@code payment_intent.succeeded}). Idempotent: a
   * no-op if the order is already terminal.
   */
  public void confirmPayment(long orderId) {
    finishConfirmed(orderId);
    log.info("order {} CONFIRMED", orderId);
  }

  /**
   * Webhook entry point for a failed payment ({@code payment_intent.payment_failed}). Idempotent: a
   * no-op if the order is already terminal. Inventory releases the reservation off OrderFailed.
   */
  public void failPayment(long orderId, String reason) {
    log.info("order {} FAILED — {}", orderId, reason);
    finishFailed(orderId, reason);
  }

  /**
   * Resumes a non-terminal order toward a terminal state (Milestone D3 recovery). Safe to call on
   * any order: terminal orders are a no-op. A PAYING order with a PaymentIntent is reconciled
   * against Stripe (its webhook may have been missed); anything else re-enters {@link #run} (the
   * reserve and pay-initiation steps are idempotent).
   */
  public void recover(long orderId) {
    Order order =
        orders
            .findWithItemsById(orderId)
            .orElseThrow(() -> new IllegalStateException("order not found: " + orderId));

    if (isTerminal(order.getStatus())) {
      return;
    }
    if (order.getStatus() == PAYING && order.getPaymentIntentId() != null) {
      reconcilePayment(orderId, order.getPaymentIntentId());
    } else {
      run(orderId); // PENDING/RESERVING, or PAYING before the intent was persisted
    }
  }

  /** Queries Stripe for the PaymentIntent's real outcome and applies the matching transition. */
  private void reconcilePayment(long orderId, String paymentIntentId) {
    String status;
    try {
      status = payments.getPaymentStatus(paymentIntentId);
    } catch (PaymentGatewayException e) {
      log.warn("recover order {} — could not query Stripe; will retry next scan", orderId, e);
      return;
    }
    switch (status) {
      case "succeeded" -> confirmPayment(orderId);
      case "canceled" -> failPayment(orderId, "payment_canceled");
      // A confirmed-then-declined PaymentIntent falls back to requires_payment_method.
      case "requires_payment_method" -> failPayment(orderId, "payment_failed");
      default ->
          log.info(
              "recover order {} — PaymentIntent still '{}'; leaving in PAYING", orderId, status);
    }
  }

  /** Moves the order to {@code next} in its own transaction; a no-op if already there. */
  private void transition(long orderId, OrderStatus next) {
    tx.executeWithoutResult(
        status -> {
          Order order = managed(orderId);
          if (order.getStatus() == next) {
            return;
          }
          guard(orderId, order.getStatus(), next);
          order.setStatus(next);
        });
  }

  /** CONFIRMED + an {@code OrderConfirmed} outbox event, atomically. Idempotent on re-delivery. */
  private void finishConfirmed(long orderId) {
    tx.executeWithoutResult(
        status -> {
          Order order = managed(orderId);
          if (isTerminal(order.getStatus())) {
            if (order.getStatus() != CONFIRMED) {
              log.warn("order {} already {} — ignoring late confirm", orderId, order.getStatus());
            }
            return;
          }
          guard(orderId, order.getStatus(), CONFIRMED);
          order.setStatus(CONFIRMED);
          emitTerminal(order, "OrderConfirmed", null);
        });
  }

  /** FAILED + an {@code OrderFailed} outbox event, atomically (Inventory releases on consume). */
  private void finishFailed(long orderId, String reason) {
    tx.executeWithoutResult(
        status -> {
          Order order = managed(orderId);
          if (isTerminal(order.getStatus())) {
            return;
          }
          order.setStatus(FAILED);
          emitTerminal(order, "OrderFailed", reason);
        });
  }

  private void emitTerminal(Order order, String eventType, String reason) {
    outbox.save(
        new OutboxEvent(
            "Order",
            order.getId(),
            eventType,
            ORDERS_TOPIC,
            terminalPayload(order, eventType, reason),
            Tracing.currentTraceId(),
            Tracing.currentTraceParent()));
  }

  private String terminalPayload(Order order, String eventType, String reason) {
    Map<String, Object> payload = new LinkedHashMap<>();
    payload.put("order_id", order.getId());
    payload.put("order_number", order.getOrderNumber());
    payload.put("user_id", order.getUserId());
    payload.put("status", order.getStatus().name());
    payload.put("total_cents", order.getTotalCents());
    payload.put("currency", order.getCurrency());
    if (reason != null) {
      payload.put("reason", reason);
    }
    payload.put("occurred_at", Instant.now().toString());
    try {
      return objectMapper.writeValueAsString(payload);
    } catch (JsonProcessingException e) {
      throw new IllegalStateException("failed to serialize " + eventType + " payload", e);
    }
  }

  private Order managed(long orderId) {
    return orders
        .findById(orderId)
        .orElseThrow(() -> new IllegalStateException("order not found: " + orderId));
  }

  private OrderStatus currentStatus(long orderId) {
    return managed(orderId).getStatus();
  }

  private static java.util.List<InventoryClient.ReserveItem> reserveItems(Order order) {
    return order.getLineItems().stream()
        .map(li -> new InventoryClient.ReserveItem(li.getProductId(), li.getQuantity()))
        .toList();
  }

  private static void guard(long orderId, OrderStatus from, OrderStatus to) {
    if (!ALLOWED.getOrDefault(from, Set.of()).contains(to)) {
      throw new IllegalOrderTransitionException(orderId, from, to);
    }
  }

  private static boolean isTerminal(OrderStatus status) {
    return status == CONFIRMED || status == FAILED;
  }
}
