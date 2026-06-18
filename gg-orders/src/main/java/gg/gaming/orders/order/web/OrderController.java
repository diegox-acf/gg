package gg.gaming.orders.order.web;

import gg.gaming.orders.order.CreateOrderCommand;
import gg.gaming.orders.order.Order;
import gg.gaming.orders.order.OrderService;
import gg.gaming.orders.saga.SagaOrchestrator;
import jakarta.validation.Valid;
import java.util.List;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestHeader;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.RestController;

@RestController
@RequestMapping("/orders")
class OrderController {

  private final OrderService service;
  private final SagaOrchestrator saga;

  OrderController(OrderService service, SagaOrchestrator saga) {
    this.service = service;
    this.saga = saga;
  }

  /**
   * Creates an order and runs the checkout saga (reserve → pay → confirm). Identity ({@code
   * X-User-Id}) is forwarded by the BFF; creation is idempotent on {@code Idempotency-Key}. Returns
   * the order in its terminal state ({@code CONFIRMED}/{@code FAILED}); the status is 201 because
   * the order resource was created regardless of the saga outcome.
   */
  @PostMapping
  ResponseEntity<OrderResponse> create(
      @RequestHeader("X-User-Id") String userId,
      @RequestHeader("Idempotency-Key") String idempotencyKey,
      @Valid @RequestBody CreateOrderRequest request) {
    Order order = service.createOrder(toCommand(userId, idempotencyKey, request));
    saga.run(order.getId());
    return ResponseEntity.status(HttpStatus.CREATED)
        .body(OrderResponse.from(service.getOrder(order.getId())));
  }

  @GetMapping("/{id}")
  OrderResponse get(@PathVariable long id) {
    return OrderResponse.from(service.getOrder(id));
  }

  @GetMapping
  List<OrderResponse> listForUser(@RequestParam("user_id") String userId) {
    return service.listOrdersForUser(userId).stream().map(OrderResponse::from).toList();
  }

  private static CreateOrderCommand toCommand(
      String userId, String idempotencyKey, CreateOrderRequest request) {
    List<CreateOrderCommand.Item> items =
        request.items().stream()
            .map(i -> new CreateOrderCommand.Item(i.productId(), i.quantity()))
            .toList();
    CreateOrderRequest.Shipping s = request.shipping();
    CreateOrderCommand.ShippingAddress shipping =
        new CreateOrderCommand.ShippingAddress(
            s.name(), s.line1(), s.line2(), s.city(), s.state(), s.postalCode(), s.country());
    return new CreateOrderCommand(userId, idempotencyKey, items, shipping);
  }
}
