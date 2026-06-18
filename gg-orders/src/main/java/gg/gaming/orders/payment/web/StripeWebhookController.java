package gg.gaming.orders.payment.web;

import gg.gaming.orders.payment.PaymentWebhookService;
import gg.gaming.orders.payment.WebhookVerificationException;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.ExceptionHandler;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestHeader;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

/**
 * Stripe webhook receiver. The raw request body is required for signature verification, so it is
 * taken as a {@code String} (not a parsed DTO). Returns 200 for every verified event — including
 * types we ignore — so Stripe stops retrying; 400 only when the signature fails to verify.
 */
@RestController
@RequestMapping("/webhooks/stripe")
class StripeWebhookController {

  private final PaymentWebhookService service;

  StripeWebhookController(PaymentWebhookService service) {
    this.service = service;
  }

  @PostMapping
  ResponseEntity<Void> receive(
      @RequestBody String payload, @RequestHeader("Stripe-Signature") String signature) {
    service.handle(payload, signature);
    return ResponseEntity.ok().build();
  }

  @ExceptionHandler(WebhookVerificationException.class)
  ResponseEntity<Void> onBadSignature(WebhookVerificationException e) {
    return ResponseEntity.status(HttpStatus.BAD_REQUEST).build();
  }
}
