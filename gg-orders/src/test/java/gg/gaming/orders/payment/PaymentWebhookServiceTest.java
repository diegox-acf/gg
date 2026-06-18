package gg.gaming.orders.payment;

import static org.assertj.core.api.Assertions.assertThatThrownBy;
import static org.mockito.Mockito.mock;
import static org.mockito.Mockito.verifyNoInteractions;

import gg.gaming.orders.config.PaymentProperties;
import gg.gaming.orders.saga.SagaOrchestrator;
import java.nio.charset.StandardCharsets;
import javax.crypto.Mac;
import javax.crypto.spec.SecretKeySpec;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;

/**
 * Signature-verification and dispatch behaviour of the webhook handler with collaborators mocked.
 * The succeeded/failed → saga mapping needs a full Stripe-shaped, deserializable event and is
 * covered live via the Stripe CLI (see ADR-020 / Milestone D2 verification).
 */
class PaymentWebhookServiceTest {

  private static final String SECRET = "whsec_test_secret";

  private PaymentEventRepository events;
  private SagaOrchestrator saga;
  private PaymentWebhookService service;

  @BeforeEach
  void setUp() {
    events = mock(PaymentEventRepository.class);
    saga = mock(SagaOrchestrator.class);
    service =
        new PaymentWebhookService(
            new PaymentProperties("sk_test", SECRET),
            events,
            saga,
            new com.fasterxml.jackson.databind.ObjectMapper());
  }

  @Test
  void rejectsPayloadWithInvalidSignature() {
    String payload = "{\"id\":\"evt_1\",\"type\":\"payment_intent.succeeded\"}";
    String badHeader = "t=" + (System.currentTimeMillis() / 1000) + ",v1=deadbeef";

    assertThatThrownBy(() -> service.handle(payload, badHeader))
        .isInstanceOf(WebhookVerificationException.class);
    verifyNoInteractions(saga, events);
  }

  @Test
  void ignoresUnhandledEventType_withoutTouchingSagaOrRepo() {
    String payload =
        "{\"id\":\"evt_2\",\"object\":\"event\",\"type\":\"charge.refunded\",\"data\":{\"object\":{}}}";

    service.handle(payload, sign(payload));

    verifyNoInteractions(saga, events);
  }

  /** Builds a valid {@code Stripe-Signature} header for the payload, as Stripe would. */
  private static String sign(String payload) {
    long timestamp = System.currentTimeMillis() / 1000;
    String signedPayload = timestamp + "." + payload;
    try {
      Mac mac = Mac.getInstance("HmacSHA256");
      mac.init(new SecretKeySpec(SECRET.getBytes(StandardCharsets.UTF_8), "HmacSHA256"));
      byte[] hash = mac.doFinal(signedPayload.getBytes(StandardCharsets.UTF_8));
      StringBuilder hex = new StringBuilder(hash.length * 2);
      for (byte b : hash) {
        hex.append(String.format("%02x", b));
      }
      return "t=" + timestamp + ",v1=" + hex;
    } catch (Exception e) {
      throw new IllegalStateException(e);
    }
  }
}
