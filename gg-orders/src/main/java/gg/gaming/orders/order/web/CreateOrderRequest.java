package gg.gaming.orders.order.web;

import jakarta.validation.Valid;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotEmpty;
import jakarta.validation.constraints.NotNull;
import jakarta.validation.constraints.Positive;
import java.util.List;

/** Checkout request body. Field names bind from snake_case JSON (global Jackson setting). */
public record CreateOrderRequest(
    @NotEmpty List<@Valid Item> items, @NotNull @Valid Shipping shipping) {

  public record Item(@Positive long productId, @Positive int quantity) {}

  public record Shipping(
      @NotBlank String name,
      @NotBlank String line1,
      String line2,
      @NotBlank String city,
      @NotBlank String state,
      @NotBlank String postalCode,
      @NotBlank String country) {}
}
