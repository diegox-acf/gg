package gg.gaming.orders.inventory;

/** Inventory was unreachable or returned an unexpected error during reservation. */
public class InventoryUnavailableException extends RuntimeException {

  public InventoryUnavailableException(String message, Throwable cause) {
    super(message, cause);
  }
}
