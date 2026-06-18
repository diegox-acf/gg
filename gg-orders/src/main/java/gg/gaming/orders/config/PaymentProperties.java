package gg.gaming.orders.config;

import org.springframework.boot.context.properties.ConfigurationProperties;

/**
 * Stripe configuration (test mode). {@code apiKey} authenticates outbound calls; {@code
 * webhookSecret} verifies inbound webhook signatures (printed by {@code stripe listen}); {@code
 * testPaymentMethod} is the server-side confirm PM used in dev so checkout needs no card UI ({@code
 * pm_card_visa} succeeds, {@code pm_card_chargeDeclined} fails).
 */
@ConfigurationProperties(prefix = "stripe")
public record PaymentProperties(String apiKey, String webhookSecret, String testPaymentMethod) {}
