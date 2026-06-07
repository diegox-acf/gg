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

const querySaveImage = `
INSERT INTO product_images (product_id, key, position)
VALUES (
    $1,
    $2,
    COALESCE((SELECT MAX(position) + 1 FROM product_images WHERE product_id = $1), 0)
)
RETURNING id, product_id, key, position, created_at`

const queryListImages = `
SELECT id, product_id, key, position, created_at
FROM product_images
WHERE product_id = $1
ORDER BY position, id`

const queryDeleteImage = `
DELETE FROM product_images WHERE id = $1 RETURNING key`
