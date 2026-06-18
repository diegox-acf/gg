package gg.gaming.orders.order.web;

/**
 * Response to {@code POST /orders}: the created order (resting in PAYING on success) plus the
 * Stripe {@code client_secret} the browser uses to confirm the card with Stripe Elements (ADR-021).
 * {@code clientSecret} is null when the order failed before payment (e.g. insufficient stock).
 */
public record CreateOrderResponse(OrderResponse order, String clientSecret) {}
