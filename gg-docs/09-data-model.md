# 09 — Data Model

Complete schema reference for all three service databases. This is the MVP-sealed definition — no changes without a superseding note here.

## Conventions

- Every cross-service reference (e.g. `product_id` in Inventory, `user_id` in Orders) is a **bare column with no foreign key constraint**. There is no shared database; services own their data exclusively. Referential integrity across services is enforced by the application, not the DB.
- All timestamps are `TIMESTAMPTZ` (UTC).
- Money values are `BIGINT` in cents. No `FLOAT` or `DECIMAL` for currency.
- `BIGSERIAL` for auto-increment primary keys. `UUID` for externally-visible identifiers (events, reservations).
- Enums are `VARCHAR` with a `CHECK` constraint — avoids ALTER TYPE when adding states.
- Every table that publishes events has a companion `outbox` table in the same database.

---

## `gg_catalog` — Catalog service

### `categories`

```sql
CREATE TABLE categories (
    id         TEXT        PRIMARY KEY,       -- slug used as PK, e.g. 'gpus', 'cpus'
    slug       TEXT        NOT NULL UNIQUE,   -- always equals id; kept for query symmetry
    label      TEXT        NOT NULL,
    icon       TEXT        NOT NULL DEFAULT '',
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);
```

**Note:** `id` and `slug` are always identical (e.g. both `'gpus'`). The `slug` column is redundant but harmless — the UI and API use `id` only. Not worth a migration to clean up.

### `products`

```sql
CREATE TABLE products (
    id           BIGSERIAL   PRIMARY KEY,
    sku          TEXT        NOT NULL UNIQUE,
    slug         TEXT        NOT NULL UNIQUE,
    name         TEXT        NOT NULL,
    brand        TEXT        NOT NULL,
    description  TEXT        NOT NULL DEFAULT '',
    category_id  TEXT        NOT NULL REFERENCES categories(id),
    price_cents  BIGINT      NOT NULL CHECK (price_cents >= 0),
    currency     TEXT        NOT NULL DEFAULT 'USD',
    specs        JSONB       NOT NULL DEFAULT '{}',
    stock_status TEXT        NOT NULL DEFAULT 'in-stock'
                             CHECK (stock_status IN ('in-stock', 'low-stock', 'out-of-stock')),
    created_at   TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at   TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX idx_products_category_id ON products (category_id);
CREATE INDEX idx_products_slug        ON products (slug);
CREATE INDEX idx_products_sku         ON products (sku);
```

**Notes:**
- `stock_status` is a denormalised display hint updated by Inventory events. It does not drive reservation logic — Inventory's `stock.available` is authoritative.
- `specs` is free-form JSONB, varying per category (GPUs have VRAM/cores, keyboards have switch type, etc.).
- No `status (DRAFT/ACTIVE/DISCONTINUED)` column in MVP — product lifecycle management is Phase 2.

---

## `gg_orders` — Orders service

### `orders`

```sql
CREATE TYPE order_status AS VARCHAR(20);  -- plain CHECK is used instead, see below

CREATE TABLE orders (
    id                   BIGSERIAL    PRIMARY KEY,
    order_number         VARCHAR(20)  NOT NULL UNIQUE,  -- GMR-YYYY-NNNNN
    user_id              VARCHAR(36)  NOT NULL,          -- Keycloak sub, no FK
    status               VARCHAR(20)  NOT NULL
                         CHECK (status IN ('PENDING','RESERVING','PAYING','CONFIRMED','FAILED')),
    subtotal_cents       BIGINT       NOT NULL CHECK (subtotal_cents >= 0),
    tax_cents            BIGINT       NOT NULL CHECK (tax_cents >= 0),
    shipping_cents       BIGINT       NOT NULL CHECK (shipping_cents >= 0),
    total_cents          BIGINT       NOT NULL CHECK (total_cents >= 0),
    currency             CHAR(3)      NOT NULL DEFAULT 'USD',
    payment_provider     VARCHAR(20)  NOT NULL DEFAULT 'stripe',
    payment_intent_id    VARCHAR(100),                   -- set when status reaches PAYING
    idempotency_key      VARCHAR(255) NOT NULL UNIQUE,
    -- Shipping address (snapshot at order creation; never changes after)
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
-- Sweeper and saga recovery scan non-terminal orders
CREATE INDEX idx_orders_status_created ON orders (created_at)
    WHERE status NOT IN ('CONFIRMED', 'FAILED');
```

**Notes:**
- `total_cents = subtotal_cents + tax_cents + shipping_cents`. Stored explicitly — never recomputed from line items after creation.
- `payment_provider` column added now (defaulting to `'stripe'`) to avoid a migration when a second provider is added in Phase 2.
- Shipping address is inlined — avoids a join and preserves the address at the moment of order. If the user later changes their address, the order is unaffected.

### `order_line_items`

```sql
CREATE TABLE order_line_items (
    id               BIGSERIAL    PRIMARY KEY,
    order_id         BIGINT       NOT NULL REFERENCES orders(id),
    product_id       BIGINT       NOT NULL,          -- no FK; Catalog owns this
    sku              VARCHAR(100) NOT NULL,           -- snapshot
    name_snapshot    VARCHAR(500) NOT NULL,           -- snapshot at order creation
    unit_price_cents BIGINT       NOT NULL CHECK (unit_price_cents >= 0),
    quantity         INT          NOT NULL CHECK (quantity > 0),
    total_cents      BIGINT       NOT NULL CHECK (total_cents >= 0)
                                  -- = unit_price_cents * quantity, stored explicitly
);

CREATE INDEX idx_order_line_items_order ON order_line_items (order_id);
```

**Notes:**
- `sku`, `name_snapshot`, and `unit_price_cents` are price/name snapshots from Catalog at order creation time. Catalog price changes afterward do not affect this row.
- No `updated_at` — line items are immutable after creation.

### `outbox`

```sql
CREATE TABLE outbox (
    id             BIGSERIAL   PRIMARY KEY,
    event_id       UUID        NOT NULL UNIQUE DEFAULT gen_random_uuid(),
    aggregate_type VARCHAR(50) NOT NULL,           -- 'Order'
    aggregate_id   BIGINT      NOT NULL,           -- orders.id
    event_type     VARCHAR(100) NOT NULL,
    -- e.g. 'OrderPlaced', 'OrderConfirmed', 'OrderFailed', 'OrderCancelled'
    topic          VARCHAR(100) NOT NULL,
    -- e.g. 'orders.order-created', 'orders.order-cancelled'
    payload        JSONB       NOT NULL,
    trace_id       VARCHAR(32),                    -- OTel W3C trace ID for log correlation
    published_at   TIMESTAMPTZ,                    -- NULL = pending publish
    created_at     TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- The poller queries: WHERE published_at IS NULL ORDER BY created_at
CREATE INDEX idx_outbox_pending ON outbox (created_at) WHERE published_at IS NULL;
```

### `payment_events`

Immutable audit trail of every Stripe webhook received.

```sql
CREATE TABLE payment_events (
    id                BIGSERIAL    PRIMARY KEY,
    order_id          BIGINT       NOT NULL REFERENCES orders(id),
    stripe_event_id   VARCHAR(100) NOT NULL UNIQUE,  -- Stripe's idempotency key
    stripe_event_type VARCHAR(100) NOT NULL,          -- e.g. 'payment_intent.succeeded'
    payload           JSONB        NOT NULL,
    created_at        TIMESTAMPTZ  NOT NULL DEFAULT NOW()
);

CREATE INDEX idx_payment_events_order ON payment_events (order_id);
```

**Notes:**
- `stripe_event_id` UNIQUE enforces webhook idempotency at the DB level — duplicate deliveries are no-ops.
- No `updated_at` — append-only table.

### `idempotency_keys`

```sql
CREATE TABLE idempotency_keys (
    id              BIGSERIAL    PRIMARY KEY,
    idempotency_key VARCHAR(255) NOT NULL UNIQUE,
    request_path    VARCHAR(255) NOT NULL,
    response_status INT          NOT NULL,
    response_body   JSONB        NOT NULL,
    created_at      TIMESTAMPTZ  NOT NULL DEFAULT NOW(),
    expires_at      TIMESTAMPTZ  NOT NULL DEFAULT NOW() + INTERVAL '24 hours'
);

-- Cleanup job scans expired keys
CREATE INDEX idx_idempotency_expires ON idempotency_keys (expires_at);
```

---

## `gg_inventory` — Inventory service

### `stock`

```sql
CREATE TABLE stock (
    id         BIGSERIAL PRIMARY KEY,
    product_id BIGINT    NOT NULL UNIQUE,      -- no FK; Catalog owns this
    available  INT       NOT NULL DEFAULT 0 CHECK (available >= 0),
    reserved   INT       NOT NULL DEFAULT 0 CHECK (reserved >= 0),
    version    BIGINT    NOT NULL DEFAULT 0,   -- optimistic locking; increment on every write
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);
```

**Optimistic locking pattern:**
```sql
UPDATE stock
SET available = available - $qty,
    reserved  = reserved  + $qty,
    version   = version + 1,
    updated_at = NOW()
WHERE product_id = $product_id
  AND version    = $expected_version
  AND available >= $qty;
-- If 0 rows updated: version conflict → retry, or insufficient stock → fail
```

**Notes:**
- `available + reserved` = total physical stock. They always sum to the same total unless stock is manually adjusted.
- `version` is the optimistic lock. No `SELECT FOR UPDATE` / no explicit row lock needed.

### `reservations`

```sql
CREATE TABLE reservations (
    id               BIGSERIAL    PRIMARY KEY,
    reservation_id   UUID         NOT NULL UNIQUE DEFAULT gen_random_uuid(),
    order_id         BIGINT       NOT NULL,      -- no FK; Orders owns this
    product_id       BIGINT       NOT NULL,      -- no FK; Catalog owns this
    quantity         INT          NOT NULL CHECK (quantity > 0),
    status           VARCHAR(20)  NOT NULL
                     CHECK (status IN ('RESERVED','COMMITTED','RELEASED','EXPIRED')),
    idempotency_key  VARCHAR(255) NOT NULL UNIQUE,
    expires_at       TIMESTAMPTZ  NOT NULL,      -- NOW() + 15 minutes at creation
    created_at       TIMESTAMPTZ  NOT NULL DEFAULT NOW(),
    updated_at       TIMESTAMPTZ  NOT NULL DEFAULT NOW()
);

CREATE INDEX idx_reservations_order   ON reservations (order_id);
-- Sweeper scans: WHERE status = 'RESERVED' AND expires_at < NOW()
CREATE INDEX idx_reservations_expiry  ON reservations (expires_at)
    WHERE status = 'RESERVED';
```

**Notes:**
- One row per `(order_id, product_id)` enforced at the application level (idempotency_key covers this).
- When a reservation expires the sweeper sets `status = 'EXPIRED'` and runs the stock release UPDATE in the same transaction.

### `outbox`

Same structure as the Orders outbox.

```sql
CREATE TABLE outbox (
    id             BIGSERIAL    PRIMARY KEY,
    event_id       UUID         NOT NULL UNIQUE DEFAULT gen_random_uuid(),
    aggregate_type VARCHAR(50)  NOT NULL,        -- 'Reservation'
    aggregate_id   BIGINT       NOT NULL,        -- reservations.id
    event_type     VARCHAR(100) NOT NULL,
    -- e.g. 'StockReserved', 'StockReleased', 'StockCommitted', 'StockExpired'
    topic          VARCHAR(100) NOT NULL,
    -- e.g. 'inventory.stock-reserved', 'inventory.stock-released'
    payload        JSONB        NOT NULL,
    trace_id       VARCHAR(32),
    published_at   TIMESTAMPTZ,
    created_at     TIMESTAMPTZ  NOT NULL DEFAULT NOW()
);

CREATE INDEX idx_outbox_pending ON outbox (created_at) WHERE published_at IS NULL;
```

---

## Cross-service reference summary

| Column | Lives in | References | Enforced by |
|---|---|---|---|
| `products.category_id` | gg_catalog | `categories.id` | DB foreign key (same DB) |
| `order_line_items.product_id` | gg_orders | `products.id` in gg_catalog | Application (REST fetch at order time) |
| `orders.user_id` | gg_orders | Keycloak user (external) | JWT validation in BFF |
| `reservations.product_id` | gg_inventory | `products.id` in gg_catalog | Application |
| `reservations.order_id` | gg_inventory | `orders.id` in gg_orders | Application (REST call from Orders) |

## Kafka topics and event payloads

| Topic | Event type | Published by | Consumed by |
|---|---|---|---|
| `orders.order-created` | `OrderPlaced` | Orders outbox poller | Inventory (start reservation) |
| `orders.order-cancelled` | `OrderFailed`, `OrderCancelled` | Orders outbox poller | Inventory (release reservation) |
| `inventory.stock-reserved` | `StockReserved` | Inventory outbox poller | Orders (advance saga to PAYING) |
| `inventory.stock-released` | `StockReleased`, `StockExpired` | Inventory outbox poller | Orders (mark saga FAILED if mid-flight) |
| `catalog.product-updated` | `ProductUpdated` | Catalog outbox poller | Inventory (sync stock_status hint on products) |

All event payloads carry: `event_id`, `event_type`, `version`, `occurred_at`, `trace_id`, `aggregate_id`, `payload`.
