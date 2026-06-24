package gg.gaming.orders.admin;

import java.util.Map;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.ExceptionHandler;
import org.springframework.web.bind.annotation.RestControllerAdvice;

/** Maps admin-API errors to {@code {"error": "..."}} responses (scoped to the admin package). */
@RestControllerAdvice(basePackageClasses = AdminApiExceptionHandler.class)
class AdminApiExceptionHandler {

  @ExceptionHandler(AdminForbiddenException.class)
  ResponseEntity<Map<String, String>> onForbidden(AdminForbiddenException e) {
    return error(HttpStatus.FORBIDDEN, e.getMessage());
  }

  @ExceptionHandler(InvalidAdminQueryException.class)
  ResponseEntity<Map<String, String>> onInvalidQuery(InvalidAdminQueryException e) {
    return error(HttpStatus.BAD_REQUEST, e.getMessage());
  }

  private static ResponseEntity<Map<String, String>> error(HttpStatus status, String message) {
    return ResponseEntity.status(status).body(Map.of("error", message));
  }
}
