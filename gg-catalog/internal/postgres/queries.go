package postgres

// Each product SELECT LEFT JOINs the product's primary image (lowest position).
// The key is returned as the last column and scanned into Product.ImageURL (raw);
// the service layer rewrites it to a public URL.
const primaryImageJoin = `
LEFT JOIN LATERAL (
    SELECT key FROM product_images
    WHERE product_id = p.id
    ORDER BY position, id
    LIMIT 1
) img ON true`

const queryListProducts = `
SELECT p.id, p.sku, p.slug, p.name, p.brand, p.description, p.category_id,
       p.price_cents, p.currency, p.specs, p.stock_status, p.created_at, p.updated_at,
       COALESCE(img.key, '')
FROM products p` + primaryImageJoin + `
WHERE ($1::text = '' OR p.category_id = $1)
  AND ($2::text = '' OR p.id > $2::bigint)
ORDER BY p.id
LIMIT $3`

const queryGetProduct = `
SELECT p.id, p.sku, p.slug, p.name, p.brand, p.description, p.category_id,
       p.price_cents, p.currency, p.specs, p.stock_status, p.created_at, p.updated_at,
       COALESCE(img.key, '')
FROM products p` + primaryImageJoin + `
WHERE p.id = $1`

const queryGetProductBySlug = `
SELECT p.id, p.sku, p.slug, p.name, p.brand, p.description, p.category_id,
       p.price_cents, p.currency, p.specs, p.stock_status, p.created_at, p.updated_at,
       COALESCE(img.key, '')
FROM products p` + primaryImageJoin + `
WHERE p.slug = $1`

const queryGetProductsByIDs = `
SELECT p.id, p.sku, p.slug, p.name, p.brand, p.description, p.category_id,
       p.price_cents, p.currency, p.specs, p.stock_status, p.created_at, p.updated_at,
       COALESCE(img.key, '')
FROM products p` + primaryImageJoin + `
WHERE p.id = ANY($1)`

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
