package gg.gaming.orders.consumer;

import org.apache.kafka.clients.consumer.ConsumerRecord;
import org.springframework.kafka.annotation.KafkaListener;
import org.springframework.stereotype.Component;

/**
 * Consumes {@code inventory.stock-reserved} as a notification (ADR-018: the Stock* topics are
 * observability/notification streams, not saga control flow). The OTel Java agent extracts the
 * {@code traceparent} header, so this runs inside the originating trace. Manual offset management
 * (container ack mode RECORD, auto-commit off) + dedup by {@code event_id} give effectively-once
 * processing; an unprocessable record is retried then sent to {@code <topic>.dlq} by the
 * container's error handler.
 */
@Component
public class StockReservedListener {

  private final StockEventConsumer consumer;

  StockReservedListener(StockEventConsumer consumer) {
    this.consumer = consumer;
  }

  @KafkaListener(
      topics = "inventory.stock-reserved",
      autoStartup = "${orders.consumer.enabled:true}")
  public void onStockReserved(ConsumerRecord<String, String> record) {
    consumer.handle(record.topic(), record.value());
  }
}
