-- Consumer-side idempotency (ADR-019): a consumer records every event_id it has
-- processed and skips re-deliveries, making at-least-once delivery effectively-once.
-- event_id is globally unique (UUID stamped by the producing outbox row).
CREATE TABLE consumed_events (
    event_id       UUID         PRIMARY KEY,
    consumer_group VARCHAR(100) NOT NULL,
    topic          VARCHAR(100) NOT NULL,
    processed_at   TIMESTAMPTZ  NOT NULL DEFAULT NOW()
);
