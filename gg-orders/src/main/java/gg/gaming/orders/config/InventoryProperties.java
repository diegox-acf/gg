package gg.gaming.orders.config;

import org.springframework.boot.context.properties.ConfigurationProperties;

/**
 * Inventory service location. The saga reserves stock here over synchronous REST (ADR-018); commit
 * and release happen asynchronously via Kafka, not through this client.
 */
@ConfigurationProperties(prefix = "inventory")
public record InventoryProperties(String baseUrl) {}
