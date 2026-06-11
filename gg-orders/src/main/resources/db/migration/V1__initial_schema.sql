-- Orders bounded context. Cross-domain references (user_id, product_id) are bare
-- ids with no FK — Catalog and Identity own those. See gg-docs/09-data-model.md.

CREATE TABLE orders (
    id                   BIGSERIAL    PRIMARY KEY,
    order_number         VARCHAR(20)  NOT NULL UNIQUE,            -- GMR-YYYY-NNNNN
    user_id              VARCHAR(36)  NOT NULL,                   -- Keycloak sub, no FK
    status               VARCHAR(20)  NOT NULL
                         CHECK (status IN ('PENDING','RESERVING','PAYING','CONFIRMED','FAILED')),
    subtotal_cents       BIGINT       NOT NULL CHECK (subtotal_cents >= 0),
    tax_cents            BIGINT       NOT NULL CHECK (tax_cents >= 0),
    shipping_cents       BIGINT       NOT NULL CHECK (shipping_cents >= 0),
    total_cents          BIGINT       NOT NULL CHECK (total_cents >= 0),
    currency             CHAR(3)      NOT NULL DEFAULT 'USD',
    payment_provider     VARCHAR(20)  NOT NULL DEFAULT 'stripe',
    payment_intent_id    VARCHAR(100),                            -- set when status reaches PAYING
    idempotency_key      VARCHAR(255) NOT NULL UNIQUE,
    -- Shipping address snapshot (captured at creation; never mutated afterwards).
    shipping_name        VARCHAR(255) NOT NULL,
    shipping_line1       VARCHAR(255) NOT NULL,
    shipping_line2       VARCHAR(255),
    shipping_city        VARCHAR(100) NOT NULL,
    shipping_state       VARCHAR(100) NOT NULL,
    shipping_postal_code VARCHAR(20)  NOT NULL,
    shipping_country     CHAR(2)      NOT NULL DEFAULT 'US',
    created_at           TIMESTAMPTZ  NOT NULL DEFAULT NOW(),
    updated_at           TIMESTAMPTZ  NOT NULL DEFAULT NOW()
);

CREATE INDEX idx_orders_user_id ON orders (user_id);
-- Saga recovery + sweeper scan non-terminal orders.
CREATE INDEX idx_orders_status_created ON orders (created_at)
    WHERE status NOT IN ('CONFIRMED', 'FAILED');

CREATE TABLE order_line_items (
    id               BIGSERIAL    PRIMARY KEY,
    order_id         BIGINT       NOT NULL REFERENCES orders(id),
    product_id       BIGINT       NOT NULL,                       -- no FK; Catalog owns this
    sku              VARCHAR(100) NOT NULL,                       -- snapshot
    name_snapshot    VARCHAR(500) NOT NULL,                       -- snapshot at order creation
    unit_price_cents BIGINT       NOT NULL CHECK (unit_price_cents >= 0),
    quantity         INT          NOT NULL CHECK (quantity > 0),
    total_cents      BIGINT       NOT NULL CHECK (total_cents >= 0) -- = unit_price_cents * quantity
);

CREATE INDEX idx_order_line_items_order ON order_line_items (order_id);

-- Transactional outbox (ADR-006). Written in the same tx as the state change.
CREATE TABLE outbox (
    id             BIGSERIAL    PRIMARY KEY,
    event_id       UUID         NOT NULL UNIQUE DEFAULT gen_random_uuid(),
    aggregate_type VARCHAR(50)  NOT NULL,                         -- 'Order'
    aggregate_id   BIGINT       NOT NULL,                         -- orders.id
    event_type     VARCHAR(100) NOT NULL,                        -- OrderPlaced/OrderConfirmed/...
    topic          VARCHAR(100) NOT NULL,                        -- orders.order-created/...
    payload        JSONB        NOT NULL,
    trace_id       VARCHAR(32),                                  -- W3C trace id for correlation
    published_at   TIMESTAMPTZ,                                  -- NULL = pending publish
    created_at     TIMESTAMPTZ  NOT NULL DEFAULT NOW()
);

-- The poller queries: WHERE published_at IS NULL ORDER BY created_at.
CREATE INDEX idx_outbox_pending ON outbox (created_at) WHERE published_at IS NULL;

-- Immutable audit trail of every Stripe webhook received.
CREATE TABLE payment_events (
    id                BIGSERIAL    PRIMARY KEY,
    order_id          BIGINT       NOT NULL REFERENCES orders(id),
    stripe_event_id   VARCHAR(100) NOT NULL UNIQUE,              -- enforces webhook idempotency
    stripe_event_type VARCHAR(100) NOT NULL,                     -- e.g. payment_intent.succeeded
    payload           JSONB        NOT NULL,
    created_at        TIMESTAMPTZ  NOT NULL DEFAULT NOW()
);

CREATE INDEX idx_payment_events_order ON payment_events (order_id);

-- Request-level idempotency cache for mutating endpoints (24h TTL).
CREATE TABLE idempotency_keys (
    id              BIGSERIAL    PRIMARY KEY,
    idempotency_key VARCHAR(255) NOT NULL UNIQUE,
    request_path    VARCHAR(255) NOT NULL,
    response_status INT          NOT NULL,
    response_body   JSONB        NOT NULL,
    created_at      TIMESTAMPTZ  NOT NULL DEFAULT NOW(),
    expires_at      TIMESTAMPTZ  NOT NULL DEFAULT NOW() + INTERVAL '24 hours'
);

CREATE INDEX idx_idempotency_expires ON idempotency_keys (expires_at);
