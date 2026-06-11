package gg.gaming.orders.order;

/** The order request is semantically invalid (maps to HTTP 400). */
public class InvalidOrderException extends RuntimeException {
  public InvalidOrderException(String message) {
    super(message);
  }
}
