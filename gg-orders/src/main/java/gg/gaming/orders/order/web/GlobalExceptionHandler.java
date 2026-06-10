package gg.gaming.orders.order.web;

import gg.gaming.orders.catalog.CatalogProductNotFoundException;
import gg.gaming.orders.catalog.CatalogUnavailableException;
import gg.gaming.orders.order.InvalidOrderException;
import gg.gaming.orders.order.OrderNotFoundException;
import java.util.Map;
import java.util.stream.Collectors;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.MethodArgumentNotValidException;
import org.springframework.web.bind.MissingRequestHeaderException;
import org.springframework.web.bind.annotation.ExceptionHandler;
import org.springframework.web.bind.annotation.RestControllerAdvice;

/** Maps domain and validation errors to HTTP responses ({@code {"error": "..."}}). */
@RestControllerAdvice
class GlobalExceptionHandler {

  @ExceptionHandler(MethodArgumentNotValidException.class)
  ResponseEntity<Map<String, String>> onValidation(MethodArgumentNotValidException e) {
    String message =
        e.getBindingResult().getFieldErrors().stream()
            .map(f -> f.getField() + " " + f.getDefaultMessage())
            .collect(Collectors.joining("; "));
    return error(HttpStatus.BAD_REQUEST, message.isBlank() ? "invalid request" : message);
  }

  @ExceptionHandler(MissingRequestHeaderException.class)
  ResponseEntity<Map<String, String>> onMissingHeader(MissingRequestHeaderException e) {
    return error(HttpStatus.BAD_REQUEST, "missing required header: " + e.getHeaderName());
  }

  @ExceptionHandler(InvalidOrderException.class)
  ResponseEntity<Map<String, String>> onInvalidOrder(InvalidOrderException e) {
    return error(HttpStatus.BAD_REQUEST, e.getMessage());
  }

  @ExceptionHandler(OrderNotFoundException.class)
  ResponseEntity<Map<String, String>> onOrderNotFound(OrderNotFoundException e) {
    return error(HttpStatus.NOT_FOUND, e.getMessage());
  }

  /** Referenced product no longer exists — the order can't be priced. */
  @ExceptionHandler(CatalogProductNotFoundException.class)
  ResponseEntity<Map<String, String>> onProductNotFound(CatalogProductNotFoundException e) {
    return error(HttpStatus.UNPROCESSABLE_ENTITY, e.getMessage());
  }

  @ExceptionHandler(CatalogUnavailableException.class)
  ResponseEntity<Map<String, String>> onCatalogUnavailable(CatalogUnavailableException e) {
    return error(HttpStatus.BAD_GATEWAY, "catalog unavailable");
  }

  private static ResponseEntity<Map<String, String>> error(HttpStatus status, String message) {
    return ResponseEntity.status(status).body(Map.of("error", message));
  }
}
