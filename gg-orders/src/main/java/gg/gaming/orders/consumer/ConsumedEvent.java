package gg.gaming.orders.consumer;

import jakarta.persistence.Column;
import jakarta.persistence.Entity;
import jakarta.persistence.Id;
import jakarta.persistence.Table;
import java.time.Instant;
import java.util.UUID;
import org.hibernate.annotations.CreationTimestamp;

/**
 * A Kafka event this service has already processed, keyed by the producer-stamped {@code event_id}.
 * Consumers check this before acting and skip re-deliveries, turning at-least-once delivery into an
 * effectively-once effect (ADR-019).
 */
@Entity
@Table(name = "consumed_events")
public class ConsumedEvent {

  @Id
  @Column(name = "event_id", updatable = false, nullable = false)
  private UUID eventId;

  @Column(name = "consumer_group", nullable = false)
  private String consumerGroup;

  @Column(nullable = false)
  private String topic;

  @CreationTimestamp
  @Column(name = "processed_at", nullable = false, updatable = false)
  private Instant processedAt;

  protected ConsumedEvent() {
    // JPA
  }

  public ConsumedEvent(UUID eventId, String consumerGroup, String topic) {
    this.eventId = eventId;
    this.consumerGroup = consumerGroup;
    this.topic = topic;
  }

  public UUID getEventId() {
    return eventId;
  }
}
