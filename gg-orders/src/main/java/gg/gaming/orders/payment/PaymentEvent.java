package gg.gaming.orders.payment;

import jakarta.persistence.Column;
import jakarta.persistence.Entity;
import jakarta.persistence.GeneratedValue;
import jakarta.persistence.GenerationType;
import jakarta.persistence.Id;
import jakarta.persistence.Table;
import java.time.Instant;
import org.hibernate.annotations.CreationTimestamp;
import org.hibernate.annotations.JdbcTypeCode;
import org.hibernate.type.SqlTypes;

/**
 * Append-only audit row for a Stripe webhook (09-data-model.md). The UNIQUE {@code stripeEventId}
 * is the webhook idempotency guard: a duplicate delivery violates the constraint, so it is a no-op
 * (ADR-020). Never updated.
 */
@Entity
@Table(name = "payment_events")
public class PaymentEvent {

  @Id
  @GeneratedValue(strategy = GenerationType.IDENTITY)
  private Long id;

  @Column(name = "order_id", nullable = false, updatable = false)
  private long orderId;

  @Column(name = "stripe_event_id", nullable = false, updatable = false, unique = true)
  private String stripeEventId;

  @Column(name = "stripe_event_type", nullable = false, updatable = false)
  private String stripeEventType;

  @JdbcTypeCode(SqlTypes.JSON)
  @Column(nullable = false, updatable = false)
  private String payload;

  @CreationTimestamp
  @Column(name = "created_at", nullable = false, updatable = false)
  private Instant createdAt;

  protected PaymentEvent() {
    // JPA
  }

  public PaymentEvent(long orderId, String stripeEventId, String stripeEventType, String payload) {
    this.orderId = orderId;
    this.stripeEventId = stripeEventId;
    this.stripeEventType = stripeEventType;
    this.payload = payload;
  }

  public Long getId() {
    return id;
  }

  public long getOrderId() {
    return orderId;
  }

  public String getStripeEventId() {
    return stripeEventId;
  }

  public String getStripeEventType() {
    return stripeEventType;
  }

  public String getPayload() {
    return payload;
  }

  public Instant getCreatedAt() {
    return createdAt;
  }
}
