package gg.gaming.orders.catalog;

import com.fasterxml.jackson.annotation.JsonProperty;

/** Subset of the Catalog product payload that Orders snapshots onto line items. */
public record CatalogProduct(
    long id,
    String sku,
    String name,
    @JsonProperty("price_cents") long priceCents,
    String currency) {}
