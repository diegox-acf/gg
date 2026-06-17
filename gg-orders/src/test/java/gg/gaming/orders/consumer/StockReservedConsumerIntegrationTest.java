package gg.gaming.orders.consumer;

import static org.assertj.core.api.Assertions.assertThat;
import static org.awaitility.Awaitility.await;

import java.time.Duration;
import java.util.List;
import java.util.Map;
import java.util.UUID;
import org.apache.kafka.clients.consumer.ConsumerConfig;
import org.apache.kafka.clients.consumer.ConsumerRecord;
import org.apache.kafka.clients.consumer.KafkaConsumer;
import org.apache.kafka.common.serialization.StringDeserializer;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.context.SpringBootTest;
import org.springframework.kafka.core.KafkaTemplate;
import org.springframework.kafka.test.utils.KafkaTestUtils;
import org.springframework.test.context.DynamicPropertyRegistry;
import org.springframework.test.context.DynamicPropertySource;
import org.testcontainers.containers.PostgreSQLContainer;
import org.testcontainers.junit.jupiter.Container;
import org.testcontainers.junit.jupiter.Testcontainers;
import org.testcontainers.kafka.KafkaContainer;

/**
 * End-to-end consumer behaviour against a real Kafka: a {@code StockReserved} event is consumed and
 * recorded once; a re-delivery of the same {@code event_id} is skipped (no duplicate effect, not
 * sent to the DLQ); a malformed event is retried then routed to {@code <topic>.dlq}.
 */
@SpringBootTest(properties = {"orders.consumer.enabled=true", "orders.outbox.enabled=false"})
@Testcontainers
class StockReservedConsumerIntegrationTest {

  private static final String TOPIC = "inventory.stock-reserved";
  private static final String DLQ = TOPIC + ".dlq";
  private static final String TRACE_ID = "0af7651916cd43dd8448eb211c80319c";

  @Container
  static final PostgreSQLContainer<?> POSTGRES = new PostgreSQLContainer<>("postgres:17-alpine");

  // apache/kafka KRaft single-node (matches OutboxPollerIntegrationTest and the compose broker);
  // auto-create is on in this dev image, so topics + the .dlq appear on first use.
  @Container static final KafkaContainer KAFKA = new KafkaContainer("apache/kafka:4.2.0");

  @DynamicPropertySource
  static void props(DynamicPropertyRegistry registry) {
    registry.add("spring.datasource.url", POSTGRES::getJdbcUrl);
    registry.add("spring.datasource.username", POSTGRES::getUsername);
    registry.add("spring.datasource.password", POSTGRES::getPassword);
    registry.add("spring.kafka.bootstrap-servers", KAFKA::getBootstrapServers);
  }

  @Autowired private KafkaTemplate<String, String> kafka;
  @Autowired private ConsumedEventRepository consumed;

  @Test
  void consumesOnceDedupsRedeliveryAndDlqsPoison() {
    UUID eventId = UUID.randomUUID();
    String envelope = envelope(eventId);

    // Happy path: the event is consumed and recorded.
    kafka.send(TOPIC, "7", envelope);
    await()
        .atMost(Duration.ofSeconds(30))
        .untilAsserted(() -> assertThat(consumed.existsById(eventId)).isTrue());

    // Re-delivery of the same event_id is skipped — no duplicate row, no exception → no DLQ record.
    kafka.send(TOPIC, "7", envelope);
    await()
        .during(Duration.ofSeconds(2))
        .atMost(Duration.ofSeconds(4))
        .untilAsserted(() -> assertThat(consumed.count()).isEqualTo(1L));

    // Poison message: unparseable → retried → routed to the DLQ.
    kafka.send(TOPIC, "7", "not-json");
    try (KafkaConsumer<String, String> dlqConsumer = new KafkaConsumer<>(consumerProps())) {
      dlqConsumer.subscribe(List.of(DLQ));
      ConsumerRecord<String, String> dead =
          KafkaTestUtils.getSingleRecord(dlqConsumer, DLQ, Duration.ofSeconds(30));
      assertThat(dead.value()).isEqualTo("not-json");
    }
    // The duplicate did not reach the DLQ; only the poison did, and only one row was ever recorded.
    assertThat(consumed.count()).isEqualTo(1L);
  }

  private static String envelope(UUID eventId) {
    return """
        {"event_id":"%s","event_type":"StockReserved","version":1,"aggregate_type":"Reservation",\
        "aggregate_id":7,"occurred_at":"2026-06-17T00:00:00Z","trace_id":"%s",\
        "payload":{"order_id":7,"product_id":1,"quantity":2,"status":"RESERVED"}}"""
        .formatted(eventId, TRACE_ID);
  }

  private Map<String, Object> consumerProps() {
    return Map.of(
        ConsumerConfig.BOOTSTRAP_SERVERS_CONFIG,
        KAFKA.getBootstrapServers(),
        ConsumerConfig.GROUP_ID_CONFIG,
        "dlq-probe-" + UUID.randomUUID(),
        ConsumerConfig.AUTO_OFFSET_RESET_CONFIG,
        "earliest",
        ConsumerConfig.KEY_DESERIALIZER_CLASS_CONFIG,
        StringDeserializer.class,
        ConsumerConfig.VALUE_DESERIALIZER_CLASS_CONFIG,
        StringDeserializer.class);
  }
}
