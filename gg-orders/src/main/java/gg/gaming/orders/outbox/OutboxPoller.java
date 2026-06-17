package gg.gaming.orders.outbox;

import gg.gaming.orders.config.OutboxProperties;
import java.time.Instant;
import java.util.List;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.boot.autoconfigure.condition.ConditionalOnProperty;
import org.springframework.data.domain.Limit;
import org.springframework.scheduling.annotation.Scheduled;
import org.springframework.stereotype.Component;
import org.springframework.transaction.annotation.Transactional;

/**
 * Relays the transactional outbox to Kafka (ADR-006). Each cycle claims a batch of unpublished rows
 * with {@code FOR UPDATE SKIP LOCKED}, publishes each synchronously, and stamps {@code
 * published_at} — all in one transaction. A crash (or publish failure) before commit leaves the
 * rows unpublished, so they are retried next cycle: delivery is at-least-once and consumers dedup
 * by {@code event_id} (ADR-019). A crash after a successful send but before commit re-publishes → a
 * duplicate, never a loss, which is the intended bias.
 */
@Component
@ConditionalOnProperty(prefix = "orders.outbox", name = "enabled", matchIfMissing = true)
public class OutboxPoller {

  private static final Logger log = LoggerFactory.getLogger(OutboxPoller.class);

  private final OutboxRepository outbox;
  private final OutboxEventPublisher publisher;
  private final OutboxProperties props;

  OutboxPoller(OutboxRepository outbox, OutboxEventPublisher publisher, OutboxProperties props) {
    this.outbox = outbox;
    this.publisher = publisher;
    this.props = props;
  }

  @Scheduled(fixedDelayString = "${orders.outbox.poll-delay-ms}")
  @Transactional
  public void publishPending() {
    List<OutboxEvent> batch = outbox.findUnpublishedBatch(Limit.of(props.batchSize()));
    if (batch.isEmpty()) {
      return;
    }
    Instant now = Instant.now();
    for (OutboxEvent event : batch) {
      publisher.publish(event); // throws -> whole batch rolls back, retried next cycle
      event.markPublished(now);
    }
    log.info("published {} outbox event(s) to Kafka", batch.size());
  }
}
