package gg.gaming.orders.catalog;

/** Catalog could not be reached or returned an unexpected error. */
public class CatalogUnavailableException extends RuntimeException {
  public CatalogUnavailableException(String message, Throwable cause) {
    super(message, cause);
  }
}
