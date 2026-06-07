package postgres

import (
	"context"
	"fmt"

	"github.com/diegox-acf/gg-catalog/internal/catalog"
	"github.com/jackc/pgx/v5/pgxpool"
)

type Repository struct {
	pool *pgxpool.Pool
}

func NewRepository(pool *pgxpool.Pool) *Repository {
	return &Repository{pool: pool}
}

func (r *Repository) ListProducts(ctx context.Context, filter catalog.ListProductsFilter) ([]*catalog.Product, string, error) {
	rows, err := r.pool.Query(ctx, queryListProducts,
		filter.CategoryID,
		filter.PageToken,
		filter.PageSize+1, // fetch one extra to detect next page
	)
	if err != nil {
		return nil, "", fmt.Errorf("list products: %w", err)
	}
	defer rows.Close()

	var products []*catalog.Product
	for rows.Next() {
		p := &catalog.Product{}
		if err := rows.Scan(
			&p.ID, &p.SKU, &p.Slug, &p.Name, &p.Brand, &p.Description,
			&p.CategoryID, &p.PriceCents, &p.Currency, &p.Specs,
			&p.StockStatus, &p.CreatedAt, &p.UpdatedAt,
		); err != nil {
			return nil, "", fmt.Errorf("list products scan: %w", err)
		}
		products = append(products, p)
	}
	if err := rows.Err(); err != nil {
		return nil, "", fmt.Errorf("list products rows: %w", err)
	}

	var nextToken string
	if int32(len(products)) > filter.PageSize {
		nextToken = fmt.Sprintf("%d", products[filter.PageSize].ID)
		products = products[:filter.PageSize]
	}

	return products, nextToken, nil
}

func (r *Repository) GetProduct(ctx context.Context, id int64) (*catalog.Product, error) {
	p := &catalog.Product{}
	err := r.pool.QueryRow(ctx, queryGetProduct, id).Scan(
		&p.ID, &p.SKU, &p.Slug, &p.Name, &p.Brand, &p.Description,
		&p.CategoryID, &p.PriceCents, &p.Currency, &p.Specs,
		&p.StockStatus, &p.CreatedAt, &p.UpdatedAt,
	)
	if err != nil {
		return nil, fmt.Errorf("get product %d: %w", id, err)
	}
	return p, nil
}

func (r *Repository) GetProductBySlug(ctx context.Context, slug string) (*catalog.Product, error) {
	p := &catalog.Product{}
	err := r.pool.QueryRow(ctx, queryGetProductBySlug, slug).Scan(
		&p.ID, &p.SKU, &p.Slug, &p.Name, &p.Brand, &p.Description,
		&p.CategoryID, &p.PriceCents, &p.Currency, &p.Specs,
		&p.StockStatus, &p.CreatedAt, &p.UpdatedAt,
	)
	if err != nil {
		return nil, fmt.Errorf("get product slug %q: %w", slug, err)
	}
	return p, nil
}

func (r *Repository) GetProductsByIDs(ctx context.Context, ids []int64) ([]*catalog.Product, error) {
	rows, err := r.pool.Query(ctx, queryGetProductsByIDs, ids)
	if err != nil {
		return nil, fmt.Errorf("get products by ids: %w", err)
	}
	defer rows.Close()

	var products []*catalog.Product
	for rows.Next() {
		p := &catalog.Product{}
		if err := rows.Scan(
			&p.ID, &p.SKU, &p.Slug, &p.Name, &p.Brand, &p.Description,
			&p.CategoryID, &p.PriceCents, &p.Currency, &p.Specs,
			&p.StockStatus, &p.CreatedAt, &p.UpdatedAt,
		); err != nil {
			return nil, fmt.Errorf("get products by ids scan: %w", err)
		}
		products = append(products, p)
	}
	return products, rows.Err()
}

func (r *Repository) ListCategories(ctx context.Context) ([]*catalog.Category, error) {
	rows, err := r.pool.Query(ctx, queryListCategories)
	if err != nil {
		return nil, fmt.Errorf("list categories: %w", err)
	}
	defer rows.Close()

	var categories []*catalog.Category
	for rows.Next() {
		c := &catalog.Category{}
		if err := rows.Scan(&c.ID, &c.Slug, &c.Label, &c.Icon, &c.CreatedAt); err != nil {
			return nil, fmt.Errorf("list categories scan: %w", err)
		}
		categories = append(categories, c)
	}
	return categories, rows.Err()
}

func (r *Repository) SaveImage(ctx context.Context, img *catalog.ProductImage) (*catalog.ProductImage, error) {
	out := &catalog.ProductImage{}
	err := r.pool.QueryRow(ctx, querySaveImage, img.ProductID, img.Key).Scan(
		&out.ID, &out.ProductID, &out.Key, &out.Position, &out.CreatedAt,
	)
	if err != nil {
		return nil, fmt.Errorf("save image: %w", err)
	}
	return out, nil
}

func (r *Repository) ListImages(ctx context.Context, productID int64) ([]*catalog.ProductImage, error) {
	rows, err := r.pool.Query(ctx, queryListImages, productID)
	if err != nil {
		return nil, fmt.Errorf("list images: %w", err)
	}
	defer rows.Close()

	var imgs []*catalog.ProductImage
	for rows.Next() {
		img := &catalog.ProductImage{}
		if err := rows.Scan(&img.ID, &img.ProductID, &img.Key, &img.Position, &img.CreatedAt); err != nil {
			return nil, fmt.Errorf("list images scan: %w", err)
		}
		imgs = append(imgs, img)
	}
	return imgs, rows.Err()
}

func (r *Repository) DeleteImage(ctx context.Context, id int64) (string, error) {
	var key string
	if err := r.pool.QueryRow(ctx, queryDeleteImage, id).Scan(&key); err != nil {
		return "", fmt.Errorf("delete image %d: %w", id, err)
	}
	return key, nil
}
