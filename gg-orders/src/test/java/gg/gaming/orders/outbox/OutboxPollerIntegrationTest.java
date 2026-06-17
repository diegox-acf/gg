package gg.gaming.orders.outbox;

import static org.assertj.core.api.Assertions.assertThat;
import static org.awaitility.Awaitility.await;

import com.fasterxml.jackson.databind.ObjectMapper;
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
import org.springframework.kafka.test.utils.KafkaTestUtils;
import org.springframework.test.context.DynamicPropertyRegistry;
import org.springframework.test.context.DynamicPropertySource;
import org.testcontainers.containers.PostgreSQLContainer;
import org.testcontainers.junit.jupiter.Container;
import org.testcontainers.junit.jupiter.Testcontainers;
import org.testcontainers.kafka.KafkaContainer;

/**
 * Exercises the real publish path against a Testcontainers Kafka: a committed outbox row is picked
 * up by the scheduled poller, published as the documented envelope, and stamped {@code
 * published_at}. The {@code traceparent} <em>header</em> is injected by the OpenTelemetry Java
 * agent at runtime (not present in tests), so trace continuation is verified live, not here.
 */
@SpringBootTest(properties = {"orders.outbox.enabled=true", "orders.outbox.poll-delay-ms=200"})
@Testcontainers
class OutboxPollerIntegrationTest {

  private static final String TOPIC = "orders.order-created";

  @Container
  static final PostgreSQLContainer<?> POSTGRES = new PostgreSQLContainer<>("postgres:17-alpine");

  @Container static final KafkaContainer KAFKA = new KafkaContainer("apache/kafka:4.2.0");

  @DynamicPropertySource
  static void props(DynamicPropertyRegistry registry) {
    registry.add("spring.datasource.url", POSTGRES::getJdbcUrl);
    registry.add("spring.datasource.username", POSTGRES::getUsername);
    registry.add("spring.datasource.password", POSTGRES::getPassword);
    registry.add("spring.kafka.bootstrap-servers", KAFKA::getBootstrapServers);
  }

  private final ObjectMapper mapper = new ObjectMapper();

  @Autowired private OutboxRepository outbox;

  @Test
  void publishesPendingRowThenMarksItPublished() throws Exception {
    String traceId = "0af7651916cd43dd8448eb211c80319c";
    String traceparent = "00-" + traceId + "-b7ad6b7169203331-01";
    OutboxEvent saved =
        outbox.save(
            new OutboxEvent(
                "Order",
                4242L,
                "OrderPlaced",
                TOPIC,
                "{\"order_id\":4242,\"total_cents\":26489}",
                traceId,
                traceparent));

    try (KafkaConsumer<String, String> consumer = new KafkaConsumer<>(consumerProps())) {
      consumer.subscribe(List.of(TOPIC));
      ConsumerRecord<String, String> record =
          KafkaTestUtils.getSingleRecord(consumer, TOPIC, Duration.ofSeconds(20));

      assertThat(record.key()).isEqualTo("4242"); // aggregate id → per-order partition ordering
      var env = mapper.readTree(record.value());
      assertThat(env.get("event_id").asText()).isEqualTo(saved.getEventId().toString());
      assertThat(env.get("event_type").asText()).isEqualTo("OrderPlaced");
      assertThat(env.get("aggregate_type").asText()).isEqualTo("Order");
      assertThat(env.get("aggregate_id").asLong()).isEqualTo(4242L);
      assertThat(env.get("trace_id").asText()).isEqualTo(traceId);
      assertThat(env.get("payload").get("order_id").asLong()).isEqualTo(4242L);
    }

    await()
        .atMost(Duration.ofSeconds(10))
        .untilAsserted(
            () ->
                assertThat(outbox.findById(saved.getId()))
                    .get()
                    .extracting(OutboxEvent::getPublishedAt)
                    .isNotNull());
  }

  private Map<String, Object> consumerProps() {
    return Map.of(
        ConsumerConfig.BOOTSTRAP_SERVERS_CONFIG,
        KAFKA.getBootstrapServers(),
        ConsumerConfig.GROUP_ID_CONFIG,
        "test-" + UUID.randomUUID(),
        ConsumerConfig.AUTO_OFFSET_RESET_CONFIG,
        "earliest",
        ConsumerConfig.KEY_DESERIALIZER_CLASS_CONFIG,
        StringDeserializer.class,
        ConsumerConfig.VALUE_DESERIALIZER_CLASS_CONFIG,
        StringDeserializer.class);
  }
}
