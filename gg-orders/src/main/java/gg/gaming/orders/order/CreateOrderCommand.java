package gg.gaming.orders.order;

import java.util.List;

/** Validated, transport-agnostic input to {@link OrderService#createOrder}. */
public record CreateOrderCommand(
    String userId, String idempotencyKey, List<Item> items, ShippingAddress shipping) {

  public record Item(long productId, int quantity) {}

  public record ShippingAddress(
      String name,
      String line1,
      String line2,
      String city,
      String state,
      String postalCode,
      String country) {}
}
