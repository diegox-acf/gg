package gg.gaming.orders.order;

import com.fasterxml.jackson.core.JsonProcessingException;
import com.fasterxml.jackson.databind.ObjectMapper;
import gg.gaming.orders.catalog.CatalogClient;
import gg.gaming.orders.catalog.CatalogProduct;
import gg.gaming.orders.config.OrderProperties;
import gg.gaming.orders.outbox.OutboxEvent;
import gg.gaming.orders.outbox.OutboxRepository;
import java.math.BigDecimal;
import java.math.RoundingMode;
import java.time.Instant;
import java.util.ArrayList;
import java.util.LinkedHashMap;
import java.util.List;
import java.util.Map;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.slf4j.MDC;
import org.springframework.dao.DataIntegrityViolationException;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

/**
 * Creates orders. Prices are re-fetched from Catalog (authoritative) and snapshotted; the order
 * plus its line items plus an {@code OrderPlaced} outbox row are written in one transaction
 * (ADR-006). Idempotent on the request idempotency key.
 */
@Service
public class OrderService {

  private static final Logger log = LoggerFactory.getLogger(OrderService.class);
  private static final String CURRENCY = "USD";
  private static final String OUTBOX_TOPIC = "orders.order-created";

  private final OrderRepository orders;
  private final OutboxRepository outbox;
  private final CatalogClient catalog;
  private final OrderNumberGenerator orderNumbers;
  private final OrderProperties pricing;
  private final ObjectMapper objectMapper;

  OrderService(
      OrderRepository orders,
      OutboxRepository outbox,
      CatalogClient catalog,
      OrderNumberGenerator orderNumbers,
      OrderProperties pricing,
      ObjectMapper objectMapper) {
    this.orders = orders;
    this.outbox = outbox;
    this.catalog = catalog;
    this.orderNumbers = orderNumbers;
    this.pricing = pricing;
    this.objectMapper = objectMapper;
  }

  @Transactional
  public Order createOrder(CreateOrderCommand cmd) {
    if (cmd.items() == null || cmd.items().isEmpty()) {
      throw new InvalidOrderException("order must contain at least one item");
    }

    // Idempotent replay: a previous request with the same key returns the same order.
    var existing = orders.findByIdempotencyKey(cmd.idempotencyKey());
    if (existing.isPresent()) {
      return existing.get();
    }

    Order order = new Order(orderNumbers.next(), cmd.userId(), cmd.idempotencyKey(), CURRENCY);
    var s = cmd.shipping();
    order.setShippingAddress(
        s.name(), s.line1(), s.line2(), s.city(), s.state(), s.postalCode(), s.country());

    long subtotal = 0;
    for (CreateOrderCommand.Item item : cmd.items()) {
      if (item.quantity() <= 0) {
        throw new InvalidOrderException(
            "quantity must be positive for product " + item.productId());
      }
      // Authoritative price — never trust client input.
      CatalogProduct product = catalog.getProduct(item.productId());
      OrderLineItem line =
          new OrderLineItem(
              product.id(), product.sku(), product.name(), product.priceCents(), item.quantity());
      order.addLineItem(line);
      subtotal += line.getTotalCents();
    }

    long tax = taxCents(subtotal, pricing.taxBps());
    order.setAmounts(subtotal, tax, pricing.shippingCents());

    try {
      orders.saveAndFlush(order);
    } catch (DataIntegrityViolationException race) {
      // Concurrent request with the same idempotency key won the unique constraint.
      return orders.findByIdempotencyKey(cmd.idempotencyKey()).orElseThrow(() -> race);
    }

    outbox.save(
        new OutboxEvent(
            "Order",
            order.getId(),
            "OrderPlaced",
            OUTBOX_TOPIC,
            orderPlacedPayload(order),
            MDC.get("trace_id")));

    log.info(
        "order created order_id={} order_number={} total_cents={}",
        order.getId(),
        order.getOrderNumber(),
        order.getTotalCents());
    return order;
  }

  @Transactional(readOnly = true)
  public Order getOrder(long id) {
    return orders.findWithItemsById(id).orElseThrow(() -> new OrderNotFoundException(id));
  }

  @Transactional(readOnly = true)
  public List<Order> listOrdersForUser(String userId) {
    return orders.findByUserIdOrderByCreatedAtDesc(userId);
  }

  /** Rounds tax to the nearest cent using exact integer/decimal arithmetic (no float). */
  private static long taxCents(long subtotalCents, int taxBps) {
    return BigDecimal.valueOf(subtotalCents)
        .multiply(BigDecimal.valueOf(taxBps))
        .divide(BigDecimal.valueOf(10_000), 0, RoundingMode.HALF_UP)
        .longValueExact();
  }

  private String orderPlacedPayload(Order order) {
    List<Map<String, Object>> items = new ArrayList<>();
    for (OrderLineItem li : order.getLineItems()) {
      Map<String, Object> m = new LinkedHashMap<>();
      m.put("product_id", li.getProductId());
      m.put("sku", li.getSku());
      m.put("quantity", li.getQuantity());
      m.put("unit_price_cents", li.getUnitPriceCents());
      m.put("total_cents", li.getTotalCents());
      items.add(m);
    }
    Map<String, Object> payload = new LinkedHashMap<>();
    payload.put("order_id", order.getId());
    payload.put("order_number", order.getOrderNumber());
    payload.put("user_id", order.getUserId());
    payload.put("status", order.getStatus().name());
    payload.put("currency", order.getCurrency());
    payload.put("subtotal_cents", order.getSubtotalCents());
    payload.put("tax_cents", order.getTaxCents());
    payload.put("shipping_cents", order.getShippingCents());
    payload.put("total_cents", order.getTotalCents());
    payload.put("items", items);
    payload.put("occurred_at", Instant.now().toString());
    try {
      return objectMapper.writeValueAsString(payload);
    } catch (JsonProcessingException e) {
      throw new IllegalStateException("failed to serialize OrderPlaced payload", e);
    }
  }
}
