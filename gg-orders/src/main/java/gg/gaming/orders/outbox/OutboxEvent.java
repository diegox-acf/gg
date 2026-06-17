package gg.gaming.orders.outbox;

import jakarta.persistence.Column;
import jakarta.persistence.Entity;
import jakarta.persistence.GeneratedValue;
import jakarta.persistence.GenerationType;
import jakarta.persistence.Id;
import jakarta.persistence.Table;
import java.time.Instant;
import java.util.UUID;
import org.hibernate.annotations.CreationTimestamp;
import org.hibernate.annotations.JdbcTypeCode;
import org.hibernate.type.SqlTypes;

/**
 * Transactional outbox row (ADR-006). Written in the same transaction as the state change it
 * describes; the {@link OutboxPoller} publishes it to Kafka and stamps {@link #publishedAt} ({@code
 * null} until then). Delivery is at-least-once — consumers dedup by {@link #eventId} (ADR-019).
 */
@Entity
@Table(name = "outbox")
public class OutboxEvent {

  @Id
  @GeneratedValue(strategy = GenerationType.IDENTITY)
  private Long id;

  @Column(name = "event_id", nullable = false, updatable = false)
  private UUID eventId;

  @Column(name = "aggregate_type", nullable = false)
  private String aggregateType;

  @Column(name = "aggregate_id", nullable = false)
  private long aggregateId;

  @Column(name = "event_type", nullable = false)
  private String eventType;

  @Column(nullable = false)
  private String topic;

  @JdbcTypeCode(SqlTypes.JSON)
  @Column(nullable = false)
  private String payload;

  /** W3C trace id (32 hex) of the originating span — kept for log/query correlation. */
  @Column(name = "trace_id")
  private String traceId;

  /**
   * Full W3C traceparent ({@code 00-<trace>-<span>-<flags>}) of the originating span. The poller
   * re-establishes this context so the produced Kafka span joins the original trace.
   */
  @Column(name = "traceparent")
  private String traceParent;

  @Column(name = "published_at")
  private Instant publishedAt;

  @CreationTimestamp
  @Column(name = "created_at", nullable = false, updatable = false)
  private Instant createdAt;

  protected OutboxEvent() {
    // JPA
  }

  public OutboxEvent(
      String aggregateType,
      long aggregateId,
      String eventType,
      String topic,
      String payload,
      String traceId,
      String traceParent) {
    this.eventId = UUID.randomUUID();
    this.aggregateType = aggregateType;
    this.aggregateId = aggregateId;
    this.eventType = eventType;
    this.topic = topic;
    this.payload = payload;
    this.traceId = traceId;
    this.traceParent = traceParent;
  }

  /** Stamp the row as published once the broker has acked the record. */
  public void markPublished(Instant at) {
    this.publishedAt = at;
  }

  public Long getId() {
    return id;
  }

  public UUID getEventId() {
    return eventId;
  }

  public String getAggregateType() {
    return aggregateType;
  }

  public long getAggregateId() {
    return aggregateId;
  }

  public String getEventType() {
    return eventType;
  }

  public String getTopic() {
    return topic;
  }

  public String getPayload() {
    return payload;
  }

  public String getTraceId() {
    return traceId;
  }

  public String getTraceParent() {
    return traceParent;
  }

  public Instant getPublishedAt() {
    return publishedAt;
  }

  public Instant getCreatedAt() {
    return createdAt;
  }
}
