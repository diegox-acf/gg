CREATE TABLE IF NOT EXISTS reservations (
    id              BIGSERIAL    PRIMARY KEY,
    reservation_id  UUID         NOT NULL UNIQUE DEFAULT gen_random_uuid(),
    order_id        BIGINT       NOT NULL,      -- no FK; Orders owns this
    product_id      BIGINT       NOT NULL,      -- no FK; Catalog owns this
    quantity        INT          NOT NULL CHECK (quantity > 0),
    status          VARCHAR(20)  NOT NULL
                    CHECK (status IN ('RESERVED','COMMITTED','RELEASED','EXPIRED')),
    idempotency_key VARCHAR(255) NOT NULL UNIQUE,
    expires_at      TIMESTAMPTZ  NOT NULL,      -- NOW() + 15 min at creation
    created_at      TIMESTAMPTZ  NOT NULL DEFAULT NOW(),
    updated_at      TIMESTAMPTZ  NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_reservations_order ON reservations (order_id);
-- Sweeper (later milestone) scans: WHERE status = 'RESERVED' AND expires_at < NOW()
CREATE INDEX IF NOT EXISTS idx_reservations_expiry ON reservations (expires_at)
    WHERE status = 'RESERVED';
