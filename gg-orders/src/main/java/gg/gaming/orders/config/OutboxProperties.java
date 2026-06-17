package gg.gaming.orders.config;

import org.springframework.boot.context.properties.ConfigurationProperties;

/**
 * Outbox poller tuning (Milestone C).
 *
 * @param pollDelayMs delay between poll cycles, ms (fixed-delay: next run starts this long after
 *     the previous finishes)
 * @param batchSize max rows claimed and published per cycle
 * @param sendTimeoutMs how long to wait for a broker ack per record before failing the cycle
 */
@ConfigurationProperties(prefix = "orders.outbox")
public record OutboxProperties(long pollDelayMs, int batchSize, long sendTimeoutMs) {}
