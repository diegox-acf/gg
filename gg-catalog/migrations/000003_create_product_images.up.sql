CREATE TABLE IF NOT EXISTS product_images (
    id         BIGSERIAL   PRIMARY KEY,
    product_id BIGINT      NOT NULL REFERENCES products(id) ON DELETE CASCADE,
    key        TEXT        NOT NULL UNIQUE,
    position   INT         NOT NULL DEFAULT 0,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_product_images_product_id ON product_images (product_id);
