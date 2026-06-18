package gg.gaming.orders.payment;

import com.stripe.Stripe;
import com.stripe.exception.CardException;
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
 * Thin Stripe adapter for the PAYING step. Creates a PaymentIntent and confirms it server-side with
 * a test payment method (dev has no card UI). The PaymentIntent id is returned so the saga can
 * persist it; the actual <em>outcome</em> is delivered asynchronously by Stripe as a webhook, which
 * drives the order's terminal transition (ADR-020) — this call never confirms the order.
 *
 * <p>Idempotent: the Stripe idempotency key {@code order-<id>-pi} means a retried create returns
 * the same PaymentIntent instead of charging twice.
 */
@Component
public class StripePaymentGateway {

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
   * Creates and confirms a PaymentIntent for the order, returning its id.
   *
   * <p>A declined card is <em>not</em> an error here: the PaymentIntent still exists and Stripe
   * emits {@code payment_intent.payment_failed}, so its id is returned and the webhook fails the
   * order. A {@link PaymentGatewayException} is thrown only when no PaymentIntent could be created
   * (auth/network/API error) — there will be no webhook, so the saga fails the order itself.
   */
  public String createAndConfirmPayment(
      long orderId, long amountCents, String currency, String orderNumber) {
    PaymentIntentCreateParams params =
        PaymentIntentCreateParams.builder()
            .setAmount(amountCents)
            .setCurrency(currency.toLowerCase())
            .setPaymentMethod(props.testPaymentMethod())
            .setConfirm(true)
            .setAutomaticPaymentMethods(
                PaymentIntentCreateParams.AutomaticPaymentMethods.builder()
                    .setEnabled(true)
                    // No card UI in dev → forbid redirect-based methods that need a return_url.
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
      return pi.getId();
    } catch (CardException e) {
      // Declined: the PaymentIntent exists; let the payment_intent.payment_failed webhook fail it.
      String piId =
          e.getStripeError() != null ? e.getStripeError().getPaymentIntent().getId() : null;
      log.info("order {} card declined ({}); PaymentIntent {}", orderId, e.getCode(), piId);
      if (piId == null) {
        throw new PaymentGatewayException("card declined without a PaymentIntent", e);
      }
      return piId;
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
