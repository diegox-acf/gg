package gg.gaming.orders.config;

import org.springframework.boot.context.properties.ConfigurationProperties;

/**
 * Catalog service location. Orders re-fetches authoritative product prices from here at order
 * creation (never trusts client-supplied prices).
 */
@ConfigurationProperties(prefix = "catalog")
public record CatalogProperties(String baseUrl) {}
