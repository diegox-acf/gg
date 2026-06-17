package gg.gaming.orders.outbox;

/** Thrown when an outbox row cannot be published to Kafka; rolls back the poller transaction. */
class OutboxPublishException extends RuntimeException {

  OutboxPublishException(OutboxEvent event, Throwable cause) {
    super(
        "Failed to publish outbox id=%d event_id=%s topic=%s"
            .formatted(event.getId(), event.getEventId(), event.getTopic()),
        cause);
  }
}
