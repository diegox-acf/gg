package gg.gaming.orders.consumer;

import com.fasterxml.jackson.databind.JsonNode;
import com.fasterxml.jackson.databind.ObjectMapper;
import java.util.UUID;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

/**
 * Handles inbound inventory events. For Milestone C these are notifications only — Orders records
 * having seen them (idempotency) and logs/correlates; the saga reactions land in Milestone D.
 *
 * <p>Idempotency (ADR-019): processing and the {@code consumed_events} dedup write happen in one
 * transaction. A re-delivery of an already-seen {@code event_id} is skipped. The single consumer
 * per partition means a given event_id is never processed concurrently, so an {@code existsById}
 * check is sufficient (no rollback-only flush-conflict risk).
 */
@Service
public class StockEventConsumer {

  private static final Logger log = LoggerFactory.getLogger(StockEventConsumer.class);

  private final ConsumedEventRepository consumed;
  private final ObjectMapper objectMapper;
  private final String consumerGroup;

  StockEventConsumer(
      ConsumedEventRepository consumed,
      ObjectMapper objectMapper,
      @Value("${spring.kafka.consumer.group-id}") String consumerGroup) {
    this.consumed = consumed;
    this.objectMapper = objectMapper;
    this.consumerGroup = consumerGroup;
  }

  /**
   * Processes one event envelope. Throws {@link InvalidEventException} on an unparseable envelope
   * so the error handler routes it to the DLQ rather than retrying forever.
   */
  @Transactional
  public void handle(String topic, String value) {
    JsonNode envelope = parse(value);
    UUID eventId = eventId(envelope);

    if (consumed.existsById(eventId)) {
      log.debug("duplicate event_id={} on {} — skipping", eventId, topic);
      return;
    }

    String eventType = envelope.path("event_type").asText("unknown");
    log.info(
        "consumed {} event_id={} from {} payload={}",
        eventType,
        eventId,
        topic,
        envelope.path("payload"));

    consumed.save(new ConsumedEvent(eventId, consumerGroup, topic));
  }

  private JsonNode parse(String value) {
    try {
      return objectMapper.readTree(value);
    } catch (Exception e) {
      throw new InvalidEventException("unparseable event envelope", e);
    }
  }

  private static UUID eventId(JsonNode envelope) {
    JsonNode node = envelope.get("event_id");
    if (node == null || node.isNull()) {
      throw new InvalidEventException("envelope missing event_id");
    }
    try {
      return UUID.fromString(node.asText());
    } catch (IllegalArgumentException e) {
      throw new InvalidEventException("event_id is not a UUID: " + node.asText(), e);
    }
  }
}
