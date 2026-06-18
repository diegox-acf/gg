package gg.gaming.orders.payment;

/**
 * The payment gateway could not be reached or rejected the request for an infrastructural reason
 * (auth, network, API error) — i.e. no PaymentIntent could be created, so no webhook will follow.
 * The saga fails the order synchronously. A <em>declined card</em> is not this: there the
 * PaymentIntent exists and Stripe emits {@code payment_intent.payment_failed}, which drives the
 * terminal transition (ADR-020).
 */
public class PaymentGatewayException extends RuntimeException {
  public PaymentGatewayException(String message, Throwable cause) {
    super(message, cause);
  }
}
