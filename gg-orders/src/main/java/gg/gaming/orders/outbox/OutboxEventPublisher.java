package gg.gaming.orders.outbox;

import com.fasterxml.jackson.databind.ObjectMapper;
import com.fasterxml.jackson.databind.node.ObjectNode;
import gg.gaming.orders.config.OutboxProperties;
import io.opentelemetry.api.trace.propagation.W3CTraceContextPropagator;
import io.opentelemetry.context.Context;
import io.opentelemetry.context.Scope;
import io.opentelemetry.context.propagation.TextMapGetter;
import java.util.Map;
import java.util.concurrent.TimeUnit;
import org.springframework.kafka.core.KafkaTemplate;
import org.springframework.stereotype.Component;

/**
 * Publishes one outbox row to Kafka as a versioned envelope, synchronously (waits for the broker
 * ack) so the caller can mark the row published only on success.
 *
 * <p>Trace continuity: the row carries the originating span's W3C traceparent. We re-establish that
 * context as current before sending, so the OpenTelemetry Java agent's producer instrumentation
 * creates the producer span <em>inside the original order trace</em> and injects a matching {@code
 * traceparent} header — which the (Milestone-D) consumer extracts to chain its own span in.
 */
@Component
public class OutboxEventPublisher {

  /** Carrier getter over a single-entry {@code traceparent} map. */
  private static final TextMapGetter<Map<String, String>> GETTER =
      new TextMapGetter<>() {
        @Override
        public Iterable<String> keys(Map<String, String> carrier) {
          return carrier.keySet();
        }

        @Override
        public String get(Map<String, String> carrier, String key) {
          return carrier == null ? null : carrier.get(key);
        }
      };

  private final KafkaTemplate<String, String> kafka;
  private final ObjectMapper objectMapper;
  private final OutboxProperties props;

  OutboxEventPublisher(
      KafkaTemplate<String, String> kafka, ObjectMapper objectMapper, OutboxProperties props) {
    this.kafka = kafka;
    this.objectMapper = objectMapper;
    this.props = props;
  }

  /**
   * Sends the event and blocks until acked. Throws on failure so the surrounding transaction rolls
   * back and the row stays unpublished (re-tried next cycle → at-least-once, never lost).
   */
  void publish(OutboxEvent event) {
    String value = envelope(event);
    String key =
        String.valueOf(event.getAggregateId()); // per-aggregate ordering within a partition
    try (Scope ignored = parentContext(event.getTraceParent()).makeCurrent()) {
      kafka.send(event.getTopic(), key, value).get(props.sendTimeoutMs(), TimeUnit.MILLISECONDS);
    } catch (InterruptedException e) {
      Thread.currentThread().interrupt();
      throw new OutboxPublishException(event, e);
    } catch (Exception e) {
      throw new OutboxPublishException(event, e);
    }
  }

  /**
   * Builds the documented event envelope (03-architecture.md), embedding the stored JSON payload.
   */
  private String envelope(OutboxEvent event) {
    try {
      ObjectNode root = objectMapper.createObjectNode();
      root.put("event_id", event.getEventId().toString());
      root.put("event_type", event.getEventType());
      root.put("version", 1);
      root.put("aggregate_type", event.getAggregateType());
      root.put("aggregate_id", event.getAggregateId());
      root.put("occurred_at", String.valueOf(event.getCreatedAt()));
      if (event.getTraceId() != null) {
        root.put("trace_id", event.getTraceId());
      }
      root.set("payload", objectMapper.readTree(event.getPayload()));
      return objectMapper.writeValueAsString(root);
    } catch (com.fasterxml.jackson.core.JsonProcessingException e) {
      // Payload was written by us as valid JSON; a failure here is a programming error.
      throw new IllegalStateException("Failed to build envelope for outbox id=" + event.getId(), e);
    }
  }

  /**
   * Re-creates the originating span's context from the stored traceparent, or the current (empty)
   * context if none was captured (e.g. rows written without an active span).
   */
  private Context parentContext(String traceparent) {
    if (traceparent == null || traceparent.isBlank()) {
      return Context.current();
    }
    return W3CTraceContextPropagator.getInstance()
        .extract(Context.current(), Map.of("traceparent", traceparent), GETTER);
  }
}
