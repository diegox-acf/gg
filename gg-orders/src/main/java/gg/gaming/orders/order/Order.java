package gg.gaming.orders.order;

import gg.gaming.orders.common.OrderStatus;
import jakarta.persistence.CascadeType;
import jakarta.persistence.Column;
import jakarta.persistence.Entity;
import jakarta.persistence.EnumType;
import jakarta.persistence.Enumerated;
import jakarta.persistence.GeneratedValue;
import jakarta.persistence.GenerationType;
import jakarta.persistence.Id;
import jakarta.persistence.OneToMany;
import jakarta.persistence.Table;
import java.time.Instant;
import java.util.ArrayList;
import java.util.List;
import org.hibernate.annotations.CreationTimestamp;
import org.hibernate.annotations.JdbcTypeCode;
import org.hibernate.annotations.UpdateTimestamp;
import org.hibernate.type.SqlTypes;

/**
 * A customer order. Totals are stored explicitly (never recomputed from line items after creation)
 * and the shipping address is a snapshot. Cross-domain refs ({@code userId}, line-item {@code
 * productId}) are bare ids with no FK.
 */
@Entity
@Table(name = "orders")
public class Order {

  @Id
  @GeneratedValue(strategy = GenerationType.IDENTITY)
  private Long id;

  @Column(name = "order_number", nullable = false, updatable = false)
  private String orderNumber;

  @Column(name = "user_id", nullable = false)
  private String userId;

  @Enumerated(EnumType.STRING)
  @Column(nullable = false)
  private OrderStatus status;

  @Column(name = "subtotal_cents", nullable = false)
  private long subtotalCents;

  @Column(name = "tax_cents", nullable = false)
  private long taxCents;

  @Column(name = "shipping_cents", nullable = false)
  private long shippingCents;

  @Column(name = "total_cents", nullable = false)
  private long totalCents;

  @JdbcTypeCode(SqlTypes.CHAR)
  @Column(nullable = false, length = 3)
  private String currency;

  @Column(name = "payment_provider", nullable = false)
  private String paymentProvider;

  @Column(name = "payment_intent_id")
  private String paymentIntentId;

  @Column(name = "idempotency_key", nullable = false, updatable = false)
  private String idempotencyKey;

  @Column(name = "shipping_name", nullable = false)
  private String shippingName;

  @Column(name = "shipping_line1", nullable = false)
  private String shippingLine1;

  @Column(name = "shipping_line2")
  private String shippingLine2;

  @Column(name = "shipping_city", nullable = false)
  private String shippingCity;

  @Column(name = "shipping_state", nullable = false)
  private String shippingState;

  @Column(name = "shipping_postal_code", nullable = false)
  private String shippingPostalCode;

  @JdbcTypeCode(SqlTypes.CHAR)
  @Column(name = "shipping_country", nullable = false, length = 2)
  private String shippingCountry;

  @OneToMany(mappedBy = "order", cascade = CascadeType.ALL, orphanRemoval = true)
  private List<OrderLineItem> lineItems = new ArrayList<>();

  @CreationTimestamp
  @Column(name = "created_at", nullable = false, updatable = false)
  private Instant createdAt;

  @UpdateTimestamp
  @Column(name = "updated_at", nullable = false)
  private Instant updatedAt;

  protected Order() {
    // JPA
  }

  public Order(String orderNumber, String userId, String idempotencyKey, String currency) {
    this.orderNumber = orderNumber;
    this.userId = userId;
    this.idempotencyKey = idempotencyKey;
    this.currency = currency;
    this.status = OrderStatus.PENDING;
    this.paymentProvider = "stripe";
  }

  /** Adds a line item and keeps the bidirectional link consistent. */
  public void addLineItem(OrderLineItem item) {
    item.setOrder(this);
    this.lineItems.add(item);
  }

  /** Sets the three component amounts and the derived total in one call. */
  public void setAmounts(long subtotalCents, long taxCents, long shippingCents) {
    this.subtotalCents = subtotalCents;
    this.taxCents = taxCents;
    this.shippingCents = shippingCents;
    this.totalCents = subtotalCents + taxCents + shippingCents;
  }

  public void setShippingAddress(
      String name,
      String line1,
      String line2,
      String city,
      String state,
      String postalCode,
      String country) {
    this.shippingName = name;
    this.shippingLine1 = line1;
    this.shippingLine2 = line2;
    this.shippingCity = city;
    this.shippingState = state;
    this.shippingPostalCode = postalCode;
    this.shippingCountry = country;
  }

  public Long getId() {
    return id;
  }

  public String getOrderNumber() {
    return orderNumber;
  }

  public String getUserId() {
    return userId;
  }

  public OrderStatus getStatus() {
    return status;
  }

  /** Advances the lifecycle status. Allowed-transition rules live in the saga orchestrator. */
  public void setStatus(OrderStatus status) {
    this.status = status;
  }

  /** Stripe PaymentIntent id, set when the saga reaches PAYING (Milestone D2). */
  public void setPaymentIntentId(String paymentIntentId) {
    this.paymentIntentId = paymentIntentId;
  }

  public String getPaymentIntentId() {
    return paymentIntentId;
  }

  public long getSubtotalCents() {
    return subtotalCents;
  }

  public long getTaxCents() {
    return taxCents;
  }

  public long getShippingCents() {
    return shippingCents;
  }

  public long getTotalCents() {
    return totalCents;
  }

  public String getCurrency() {
    return currency;
  }

  public String getShippingName() {
    return shippingName;
  }

  public String getShippingLine1() {
    return shippingLine1;
  }

  public String getShippingLine2() {
    return shippingLine2;
  }

  public String getShippingCity() {
    return shippingCity;
  }

  public String getShippingState() {
    return shippingState;
  }

  public String getShippingPostalCode() {
    return shippingPostalCode;
  }

  public String getShippingCountry() {
    return shippingCountry;
  }

  public List<OrderLineItem> getLineItems() {
    return lineItems;
  }

  public Instant getCreatedAt() {
    return createdAt;
  }

  public Instant getUpdatedAt() {
    return updatedAt;
  }
}
