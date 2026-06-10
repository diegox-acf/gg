package gg.gaming.orders.catalog;

/** A requested product does not exist in Catalog — the order cannot be priced. */
public class CatalogProductNotFoundException extends RuntimeException {
  public CatalogProductNotFoundException(long productId) {
    super("product not found in catalog: " + productId);
  }
}
