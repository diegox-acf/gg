CREATE TABLE IF NOT EXISTS outbox (
    id             BIGSERIAL    PRIMARY KEY,
    event_id       UUID         NOT NULL UNIQUE DEFAULT gen_random_uuid(),
    aggregate_type VARCHAR(50)  NOT NULL,        -- 'Reservation'
    aggregate_id   BIGINT       NOT NULL,        -- reservations.id
    event_type     VARCHAR(100) NOT NULL,        -- StockReserved / StockCommitted / StockReleased
    topic          VARCHAR(100) NOT NULL,        -- inventory.stock-reserved / .stock-released
    payload        JSONB        NOT NULL,
    trace_id       VARCHAR(32),                  -- OTel W3C trace ID for log correlation
    published_at   TIMESTAMPTZ,                  -- NULL = pending publish
    created_at     TIMESTAMPTZ  NOT NULL DEFAULT NOW()
);

-- The poller (later milestone) queries: WHERE published_at IS NULL ORDER BY created_at
CREATE INDEX IF NOT EXISTS idx_outbox_pending ON outbox (created_at)
    WHERE published_at IS NULL;
