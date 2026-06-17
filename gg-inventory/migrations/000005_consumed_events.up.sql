-- Consumer-side idempotency (ADR-019): records every event_id this service has processed
-- so re-deliveries of terminal order events are skipped. event_id is the producer-stamped UUID.
CREATE TABLE IF NOT EXISTS consumed_events (
    event_id       UUID         PRIMARY KEY,
    consumer_group VARCHAR(100) NOT NULL,
    topic          VARCHAR(100) NOT NULL,
    processed_at   TIMESTAMPTZ  NOT NULL DEFAULT NOW()
);
