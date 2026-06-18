package gg.gaming.orders.payment;

import com.stripe.Stripe;
import com.stripe.exception.StripeException;
import com.stripe.model.PaymentIntent;
import com.stripe.net.RequestOptions;
import com.stripe.param.PaymentIntentCreateParams;
import gg.gaming.orders.config.PaymentProperties;
import jakarta.annotation.PostConstruct;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.stereotype.Component;

/**
 * Thin Stripe adapter for the PAYING step. Creates an <strong>unconfirmed</strong> PaymentIntent
 * and returns its id + {@code client_secret}; the storefront confirms it with Stripe Elements (the
 * card never touches our backend — ADR-021). The actual outcome arrives asynchronously as a
 * webhook, which drives the order's terminal transition (ADR-020) — this call never confirms the
 * order.
 *
 * <p>Idempotent: the Stripe idempotency key {@code order-<id>-pi} means a retried create returns
 * the same PaymentIntent (same {@code client_secret}) instead of creating a second one.
 */
@Component
public class StripePaymentGateway {

  /**
   * The bits of a created PaymentIntent the saga needs: its id (persisted) and the client secret
   * (handed to the browser to confirm).
   */
  public record PaymentIntentResult(String id, String clientSecret) {}

  private static final Logger log = LoggerFactory.getLogger(StripePaymentGateway.class);

  private final PaymentProperties props;

  public StripePaymentGateway(PaymentProperties props) {
    this.props = props;
  }

  @PostConstruct
  void init() {
    Stripe.apiKey = props.apiKey();
  }

  /**
   * Creates an unconfirmed PaymentIntent for the order and returns its id + {@code client_secret}.
   * The browser confirms it with Stripe Elements; the outcome arrives later as a webhook. Throws
   * {@link PaymentGatewayException} when no PaymentIntent could be created (auth/network/API error)
   * — there will be no webhook, so the saga fails the order itself.
   */
  public PaymentIntentResult createPaymentIntent(
      long orderId, long amountCents, String currency, String orderNumber) {
    PaymentIntentCreateParams params =
        PaymentIntentCreateParams.builder()
            .setAmount(amountCents)
            .setCurrency(currency.toLowerCase())
            .setAutomaticPaymentMethods(
                PaymentIntentCreateParams.AutomaticPaymentMethods.builder()
                    .setEnabled(true)
                    // Card-only checkout → forbid redirect methods that need a return_url.
                    .setAllowRedirects(
                        PaymentIntentCreateParams.AutomaticPaymentMethods.AllowRedirects.NEVER)
                    .build())
            .putMetadata("order_id", Long.toString(orderId))
            .putMetadata("order_number", orderNumber)
            .build();
    RequestOptions options =
        RequestOptions.builder().setIdempotencyKey("order-" + orderId + "-pi").build();

    try {
      PaymentIntent pi = PaymentIntent.create(params, options);
      log.info("order {} PaymentIntent {} created, status={}", orderId, pi.getId(), pi.getStatus());
      return new PaymentIntentResult(pi.getId(), pi.getClientSecret());
    } catch (StripeException e) {
      throw new PaymentGatewayException("stripe createPaymentIntent failed: " + e.getMessage(), e);
    }
  }

  /**
   * Retrieves the current status of a PaymentIntent (e.g. {@code succeeded}, {@code
   * requires_payment_method}, {@code processing}, {@code canceled}). Used by the recovery worker to
   * reconcile an order stuck in PAYING when its webhook was missed. Throws {@link
   * PaymentGatewayException} on a Stripe error so the caller leaves the order untouched and
   * retries.
   */
  public String getPaymentStatus(String paymentIntentId) {
    try {
      return PaymentIntent.retrieve(paymentIntentId).getStatus();
    } catch (StripeException e) {
      throw new PaymentGatewayException(
          "stripe retrievePaymentIntent failed: " + e.getMessage(), e);
    }
  }
}
