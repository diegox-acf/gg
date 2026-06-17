package gg.gaming.orders.inventory;

/** Inventory rejected the reservation — a line item is out of stock (HTTP 409). Non-retryable. */
public class InsufficientStockException extends RuntimeException {

  public InsufficientStockException(long orderId) {
    super("insufficient stock to reserve order " + orderId);
  }
}
