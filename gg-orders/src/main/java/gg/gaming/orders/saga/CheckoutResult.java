package gg.gaming.orders.saga;

import gg.gaming.orders.common.OrderStatus;

/**
 * Outcome of {@link SagaOrchestrator#begin}. {@code clientSecret} is non-null only when the order
 * reached PAYING and a fresh PaymentIntent was created — it is handed to the browser to confirm the
 * card with Stripe Elements (ADR-021). It is {@code null} on failure or on idempotent re-entry.
 */
public record CheckoutResult(long orderId, OrderStatus status, String clientSecret) {}
