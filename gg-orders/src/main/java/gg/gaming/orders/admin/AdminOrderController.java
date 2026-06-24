package gg.gaming.orders.admin;

import gg.gaming.orders.common.OrderStatus;
import java.time.Instant;
import java.time.temporal.ChronoUnit;
import java.util.Locale;
import org.springframework.data.domain.PageRequest;
import org.springframework.data.domain.Pageable;
import org.springframework.data.domain.Sort;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.RestController;

/**
 * Admin (store-operator) read API. Mounted under {@code /admin/**}, which the {@link
 * AdminAccessInterceptor} guards by requiring the {@code admin} role (forwarded by the BFF as
 * {@code X-User-Roles}). See ADR-022.
 */
@RestController
@RequestMapping("/admin/orders")
class AdminOrderController {

  private static final int MAX_PAGE_SIZE = 100;

  private final AdminOrderService admin;

  AdminOrderController(AdminOrderService admin) {
    this.admin = admin;
  }

  /** Paginated, newest-first order list with optional status + created-at-range filters. */
  @GetMapping
  PageResponse<OrderSummaryResponse> list(
      @RequestParam(value = "status", required = false) String status,
      @RequestParam(value = "from", required = false) String from,
      @RequestParam(value = "to", required = false) String to,
      @RequestParam(value = "page", defaultValue = "0") int page,
      @RequestParam(value = "size", defaultValue = "20") int size) {
    OrderStatus statusFilter = parseStatus(status);
    Instant fromTs = parseInstant("from", from);
    Instant toTs = parseInstant("to", to);
    int safeSize = Math.min(Math.max(size, 1), MAX_PAGE_SIZE);
    int safePage = Math.max(page, 0);
    Pageable pageable =
        PageRequest.of(safePage, safeSize, Sort.by(Sort.Direction.DESC, "createdAt"));
    return admin.listOrders(statusFilter, fromTs, toTs, pageable);
  }

  /** Dashboard metrics: counts by status, confirmed revenue, orders today (UTC). */
  @GetMapping("/stats")
  OrderStatsResponse stats() {
    return admin.stats(Instant.now().truncatedTo(ChronoUnit.DAYS));
  }

  private static OrderStatus parseStatus(String raw) {
    if (raw == null || raw.isBlank()) {
      return null;
    }
    try {
      return OrderStatus.valueOf(raw.trim().toUpperCase(Locale.ROOT));
    } catch (IllegalArgumentException e) {
      throw new InvalidAdminQueryException("invalid status: " + raw);
    }
  }

  private static Instant parseInstant(String field, String raw) {
    if (raw == null || raw.isBlank()) {
      return null;
    }
    try {
      return Instant.parse(raw.trim());
    } catch (Exception e) {
      throw new InvalidAdminQueryException("invalid " + field + " timestamp (expected ISO-8601)");
    }
  }
}
