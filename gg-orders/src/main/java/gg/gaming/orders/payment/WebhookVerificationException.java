package gg.gaming.orders.payment;

/** The webhook payload's signature did not verify against the configured signing secret → 400. */
public class WebhookVerificationException extends RuntimeException {
  public WebhookVerificationException(String message, Throwable cause) {
    super(message, cause);
  }
}
