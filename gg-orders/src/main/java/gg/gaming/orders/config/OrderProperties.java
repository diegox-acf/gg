package gg.gaming.orders.config;

import org.springframework.boot.context.properties.ConfigurationProperties;

/**
 * Pricing constants (gg-docs/02-business-logic business rules). Cents/bps to keep money in
 * integers.
 *
 * @param taxBps sales tax in basis points (800 = 8.00%)
 * @param shippingCents flat shipping fee in cents (999 = $9.99)
 */
@ConfigurationProperties(prefix = "orders")
public record OrderProperties(int taxBps, long shippingCents) {}
