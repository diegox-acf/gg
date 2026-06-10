CREATE TABLE IF NOT EXISTS stock (
    id         BIGSERIAL   PRIMARY KEY,
    product_id BIGINT      NOT NULL UNIQUE,   -- no FK; Catalog owns products
    available  INT         NOT NULL DEFAULT 0 CHECK (available >= 0),
    reserved   INT         NOT NULL DEFAULT 0 CHECK (reserved >= 0),
    version    BIGINT      NOT NULL DEFAULT 0, -- optimistic lock; bumped every write
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);
