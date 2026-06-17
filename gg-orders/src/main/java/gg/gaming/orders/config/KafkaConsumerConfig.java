package gg.gaming.orders.config;

import org.apache.kafka.common.TopicPartition;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;
import org.springframework.kafka.config.ConcurrentKafkaListenerContainerFactory;
import org.springframework.kafka.core.ConsumerFactory;
import org.springframework.kafka.core.KafkaTemplate;
import org.springframework.kafka.listener.ContainerProperties.AckMode;
import org.springframework.kafka.listener.DeadLetterPublishingRecoverer;
import org.springframework.kafka.listener.DefaultErrorHandler;
import org.springframework.util.backoff.FixedBackOff;

/**
 * Listener-container wiring for the idempotent consumers (ADR-019):
 *
 * <ul>
 *   <li><b>Manual offset commit</b> — auto-commit is off (application.yml); ack mode {@code RECORD}
 *       commits the offset only after the listener returns (or the record is recovered to the DLQ),
 *       so a crash mid-processing re-delivers rather than loses (at-least-once).
 *   <li><b>Retry then DLQ</b> — a failing record is retried with a fixed backoff, then published to
 *       {@code <topic>.dlq} by the {@link DeadLetterPublishingRecoverer}.
 * </ul>
 */
@Configuration
public class KafkaConsumerConfig {

  /** Retries before giving up and routing to the DLQ (ADR-014/019: DLQ after retries). */
  private static final long MAX_RETRIES = 3L;

  private static final long RETRY_BACKOFF_MS = 500L;

  @Bean
  ConcurrentKafkaListenerContainerFactory<String, String> kafkaListenerContainerFactory(
      ConsumerFactory<String, String> consumerFactory, KafkaTemplate<String, String> template) {
    var factory = new ConcurrentKafkaListenerContainerFactory<String, String>();
    factory.setConsumerFactory(consumerFactory);
    factory.getContainerProperties().setAckMode(AckMode.RECORD);

    // Route exhausted records to "<source-topic>.dlq" (partition left to the producer: our DLQ
    // topics have a single partition, while source topics have several).
    var recoverer =
        new DeadLetterPublishingRecoverer(
            template, (record, ex) -> new TopicPartition(record.topic() + ".dlq", -1));
    factory.setCommonErrorHandler(
        new DefaultErrorHandler(recoverer, new FixedBackOff(RETRY_BACKOFF_MS, MAX_RETRIES)));
    return factory;
  }
}
