package gg.gaming.orders.config;

import org.springframework.boot.context.properties.ConfigurationProperties;

/**
 * Stripe configuration (test mode). {@code apiKey} authenticates outbound calls; {@code
 * webhookSecret} verifies inbound webhook signatures (printed by {@code stripe listen}). The card
 * is confirmed in the browser with Stripe Elements (ADR-021), so the backend holds no payment
 * method.
 */
@ConfigurationProperties(prefix = "stripe")
public record PaymentProperties(String apiKey, String webhookSecret) {}
