package gg.gaming.orders.payment;

import com.stripe.exception.SignatureVerificationException;
import com.stripe.model.Event;
import com.stripe.model.PaymentIntent;
import com.stripe.net.Webhook;
import gg.gaming.orders.config.PaymentProperties;
import gg.gaming.orders.saga.SagaOrchestrator;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.dao.DataIntegrityViolationException;
import org.springframework.stereotype.Service;

/**
 * Handles verified Stripe webhooks, driving the saga's terminal transition (ADR-020). Idempotent by
 * two independent guards: the {@code payment_events.stripe_event_id} UNIQUE constraint records each
 * event at most once, and the saga transitions are themselves no-ops once terminal — so a
 * redelivery never double-confirms.
 *
 * <p>Order of operations is <em>process-then-record</em>: the saga (idempotent) runs first, then
 * the audit row is written. If a crash happens between them, Stripe redelivers and the saga safely
 * re-runs; the constraint still prevents a duplicate audit row.
 */
@Service
public class PaymentWebhookService {

  private static final Logger log = LoggerFactory.getLogger(PaymentWebhookService.class);

  private static final String EVENT_SUCCEEDED = "payment_intent.succeeded";
  private static final String EVENT_FAILED = "payment_intent.payment_failed";

  private final PaymentProperties props;
  private final PaymentEventRepository events;
  private final SagaOrchestrator saga;

  public PaymentWebhookService(
      PaymentProperties props, PaymentEventRepository events, SagaOrchestrator saga) {
    this.props = props;
    this.events = events;
    this.saga = saga;
  }

  /**
   * Verifies the signature and processes the event. Throws {@link WebhookVerificationException} on
   * a bad signature (→ 400); all verified events are acknowledged (→ 200), including types we
   * ignore.
   */
  public void handle(String payload, String signatureHeader) {
    Event event;
    try {
      event = Webhook.constructEvent(payload, signatureHeader, props.webhookSecret());
    } catch (SignatureVerificationException e) {
      throw new WebhookVerificationException("invalid Stripe signature", e);
    }

    String type = event.getType();
    if (!EVENT_SUCCEEDED.equals(type) && !EVENT_FAILED.equals(type)) {
      log.debug("ignoring webhook {} of type {}", event.getId(), type);
      return;
    }

    if (events.existsByStripeEventId(event.getId())) {
      log.info("webhook {} already processed — no-op", event.getId());
      return;
    }

    PaymentIntent intent = paymentIntentOf(event);
    long orderId = orderIdOf(intent);

    if (EVENT_SUCCEEDED.equals(type)) {
      saga.confirmPayment(orderId);
    } else {
      saga.failPayment(orderId, declineReason(intent));
    }

    record(orderId, event, payload);
  }

  private void record(long orderId, Event event, String payload) {
    try {
      events.save(new PaymentEvent(orderId, event.getId(), event.getType(), payload));
    } catch (DataIntegrityViolationException concurrentDuplicate) {
      // A concurrent redelivery won the UNIQUE race; the saga already ran idempotently. Benign.
      log.info("webhook {} recorded concurrently — ignoring duplicate", event.getId());
    }
  }

  private static PaymentIntent paymentIntentOf(Event event) {
    return (PaymentIntent)
        event
            .getDataObjectDeserializer()
            .getObject()
            .orElseThrow(
                () ->
                    new IllegalStateException(
                        "cannot deserialize PaymentIntent from event " + event.getId()));
  }

  private static long orderIdOf(PaymentIntent intent) {
    String orderId = intent.getMetadata().get("order_id");
    if (orderId == null) {
      throw new IllegalStateException(
          "PaymentIntent " + intent.getId() + " has no order_id metadata");
    }
    return Long.parseLong(orderId);
  }

  private static String declineReason(PaymentIntent intent) {
    if (intent.getLastPaymentError() != null && intent.getLastPaymentError().getCode() != null) {
      return "payment_failed:" + intent.getLastPaymentError().getCode();
    }
    return "payment_failed";
  }
}
