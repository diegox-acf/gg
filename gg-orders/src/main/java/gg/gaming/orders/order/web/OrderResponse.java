package gg.gaming.orders.order.web;

import gg.gaming.orders.order.Order;
import gg.gaming.orders.order.OrderLineItem;
import java.time.Instant;
import java.util.List;

/** API view of an order. Serialized as snake_case (global Jackson setting). */
public record OrderResponse(
    long id,
    String orderNumber,
    String userId,
    String status,
    long subtotalCents,
    long taxCents,
    long shippingCents,
    long totalCents,
    String currency,
    List<LineItem> items,
    Shipping shipping,
    Instant createdAt) {

  public record LineItem(
      long productId,
      String sku,
      String name,
      long unitPriceCents,
      int quantity,
      long totalCents) {}

  public record Shipping(
      String name,
      String line1,
      String line2,
      String city,
      String state,
      String postalCode,
      String country) {}

  public static OrderResponse from(Order order) {
    List<LineItem> items = order.getLineItems().stream().map(OrderResponse::toLineItem).toList();
    Shipping shipping =
        new Shipping(
            order.getShippingName(),
            order.getShippingLine1(),
            order.getShippingLine2(),
            order.getShippingCity(),
            order.getShippingState(),
            order.getShippingPostalCode(),
            order.getShippingCountry());
    return new OrderResponse(
        order.getId(),
        order.getOrderNumber(),
        order.getUserId(),
        order.getStatus().name(),
        order.getSubtotalCents(),
        order.getTaxCents(),
        order.getShippingCents(),
        order.getTotalCents(),
        order.getCurrency(),
        items,
        shipping,
        order.getCreatedAt());
  }

  private static LineItem toLineItem(OrderLineItem li) {
    return new LineItem(
        li.getProductId(),
        li.getSku(),
        li.getNameSnapshot(),
        li.getUnitPriceCents(),
        li.getQuantity(),
        li.getTotalCents());
  }
}
