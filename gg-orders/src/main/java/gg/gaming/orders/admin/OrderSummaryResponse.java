package gg.gaming.orders.admin;

import gg.gaming.orders.order.Order;
import java.time.Instant;

/** Compact admin list view of an order (no line items). Serialized snake_case. */
public record OrderSummaryResponse(
    long id,
    String orderNumber,
    String userId,
    String status,
    long totalCents,
    String currency,
    Instant createdAt) {

  public static OrderSummaryResponse from(Order order) {
    return new OrderSummaryResponse(
        order.getId(),
        order.getOrderNumber(),
        order.getUserId(),
        order.getStatus().name(),
        order.getTotalCents(),
        order.getCurrency(),
        order.getCreatedAt());
  }
}
