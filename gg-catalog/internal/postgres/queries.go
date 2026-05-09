package postgres

const queryListProducts = `
SELECT id, sku, slug, name, brand, description, category_id,
       price_cents, currency, specs, stock_status, created_at, updated_at
FROM products
WHERE ($1::text = '' OR category_id = $1)
  AND ($2::text = '' OR id > $2::bigint)
ORDER BY id
LIMIT $3`

const queryGetProduct = `
SELECT id, sku, slug, name, brand, description, category_id,
       price_cents, currency, specs, stock_status, created_at, updated_at
FROM products
WHERE id = $1`

const queryGetProductBySlug = `
SELECT id, sku, slug, name, brand, description, category_id,
       price_cents, currency, specs, stock_status, created_at, updated_at
FROM products
WHERE slug = $1`

const queryGetProductsByIDs = `
SELECT id, sku, slug, name, brand, description, category_id,
       price_cents, currency, specs, stock_status, created_at, updated_at
FROM products
WHERE id = ANY($1)`

const queryListCategories = `
SELECT id, slug, label, icon, created_at
FROM categories
ORDER BY label`
