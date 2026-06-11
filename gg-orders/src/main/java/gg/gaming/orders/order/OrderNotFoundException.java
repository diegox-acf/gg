package gg.gaming.orders.order;

/** No order exists with the given id (maps to HTTP 404). */
public class OrderNotFoundException extends RuntimeException {
  public OrderNotFoundException(long id) {
    super("order not found: " + id);
  }
}
