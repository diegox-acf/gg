package gg.gaming.orders.config;

import org.springframework.boot.context.properties.ConfigurationProperties;

/**
 * Saga recovery worker (Milestone D3). {@code scanIntervalMs} is the fixed delay between scans for
 * non-terminal orders; the first scan runs shortly after startup, recovering orders left mid-saga
 * by a crash. Disable with {@code orders.recovery.enabled=false} (tests do).
 */
@ConfigurationProperties(prefix = "orders.recovery")
public record RecoveryProperties(boolean enabled, long scanIntervalMs) {}
