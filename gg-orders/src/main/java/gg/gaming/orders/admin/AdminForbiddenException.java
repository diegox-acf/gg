package gg.gaming.orders.admin;

/** Thrown by the admin guard when the request lacks the {@code admin} role → HTTP 403. */
class AdminForbiddenException extends RuntimeException {
  AdminForbiddenException() {
    super("admin role required");
  }
}
