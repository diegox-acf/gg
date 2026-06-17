package gg.gaming.orders.consumer;

/** A malformed/unprocessable event envelope. Non-retryable → routed straight to the DLQ. */
class InvalidEventException extends RuntimeException {

  InvalidEventException(String message) {
    super(message);
  }

  InvalidEventException(String message, Throwable cause) {
    super(message, cause);
  }
}
