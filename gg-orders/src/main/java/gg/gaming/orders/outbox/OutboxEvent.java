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
 * describes; a poller publishes it to Kafka in Milestone C ({@code publishedAt} stays null until
 * then).
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

  @Column(name = "trace_id")
  private String traceId;

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
      String traceId) {
    this.eventId = UUID.randomUUID();
    this.aggregateType = aggregateType;
    this.aggregateId = aggregateId;
    this.eventType = eventType;
    this.topic = topic;
    this.payload = payload;
    this.traceId = traceId;
  }

  public Long getId() {
    return id;
  }

  public UUID getEventId() {
    return eventId;
  }
}
