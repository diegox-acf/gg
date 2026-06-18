package gg.gaming.orders.payment;

import com.fasterxml.jackson.databind.JsonNode;
import com.fasterxml.jackson.databind.ObjectMapper;
import com.stripe.exception.SignatureVerificationException;
import com.stripe.model.Event;
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
 *
 * <p>The PaymentIntent fields we need ({@code id}, {@code metadata.order_id}, decline {@code code})
 * are read from the <strong>raw event JSON</strong>, not the typed {@code
 * getDataObjectDeserializer} — those fields are stable across Stripe API versions, so this stays
 * correct regardless of the account's webhook API version (which can lag the SDK's pinned version).
 */
@Service
public class PaymentWebhookService {

  private static final Logger log = LoggerFactory.getLogger(PaymentWebhookService.class);

  private static final String EVENT_SUCCEEDED = "payment_intent.succeeded";
  private static final String EVENT_FAILED = "payment_intent.payment_failed";

  private final PaymentProperties props;
  private final PaymentEventRepository events;
  private final SagaOrchestrator saga;
  private final ObjectMapper objectMapper;

  public PaymentWebhookService(
      PaymentProperties props,
      PaymentEventRepository events,
      SagaOrchestrator saga,
      ObjectMapper objectMapper) {
    this.props = props;
    this.events = events;
    this.saga = saga;
    this.objectMapper = objectMapper;
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

    JsonNode intent = paymentIntentNode(payload, event.getId());
    long orderId = orderIdOf(intent, event.getId());

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

  /** The {@code data.object} (the PaymentIntent) of the raw event JSON. */
  private JsonNode paymentIntentNode(String payload, String eventId) {
    try {
      JsonNode object = objectMapper.readTree(payload).path("data").path("object");
      if (object.isMissingNode() || !object.hasNonNull("id")) {
        throw new IllegalStateException("event " + eventId + " has no data.object");
      }
      return object;
    } catch (com.fasterxml.jackson.core.JsonProcessingException e) {
      throw new IllegalStateException("event " + eventId + " payload is not valid JSON", e);
    }
  }

  private static long orderIdOf(JsonNode intent, String eventId) {
    JsonNode orderId = intent.path("metadata").path("order_id");
    if (orderId.isMissingNode() || orderId.isNull()) {
      throw new IllegalStateException(
          "PaymentIntent "
              + intent.path("id").asText()
              + " (event "
              + eventId
              + ") has no order_id");
    }
    return orderId.asLong();
  }

  private static String declineReason(JsonNode intent) {
    JsonNode code = intent.path("last_payment_error").path("code");
    return code.isMissingNode() || code.isNull()
        ? "payment_failed"
        : "payment_failed:" + code.asText();
  }
}
