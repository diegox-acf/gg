package gg.gaming.orders.admin;

/** Bad admin query parameter (status / timestamp) → HTTP 400. */
class InvalidAdminQueryException extends RuntimeException {
  InvalidAdminQueryException(String message) {
    super(message);
  }
}
