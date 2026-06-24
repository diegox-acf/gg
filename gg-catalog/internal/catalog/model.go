package catalog

import (
	"encoding/json"
	"time"
)

type StockStatus string

const (
	StockStatusInStock    StockStatus = "in-stock"
	StockStatusLowStock   StockStatus = "low-stock"
	StockStatusOutOfStock StockStatus = "out-of-stock"
)

type Category struct {
	ID        string    `json:"id"`
	Slug      string    `json:"slug"`
	Label     string    `json:"label"`
	Icon      string    `json:"icon"`
	CreatedAt time.Time `json:"created_at"`
}

type Product struct {
	ID          int64           `json:"id"`
	SKU         string          `json:"sku"`
	Slug        string          `json:"slug"`
	Name        string          `json:"name"`
	Brand       string          `json:"brand"`
	Description string          `json:"description"`
	CategoryID  string          `json:"category_id"`
	PriceCents  int64           `json:"price_cents"`
	Currency    string          `json:"currency"`
	Specs       json.RawMessage `json:"specs"`
	StockStatus StockStatus     `json:"stock_status"`
	// ImageURL is the primary image's public URL (empty if none). Populated by the
	// service layer from the product's lowest-position image; the repository scans
	// the raw image key here and the service rewrites it via ImageStore.PublicURL.
	ImageURL  string    `json:"image_url,omitempty"`
	CreatedAt time.Time `json:"created_at"`
	UpdatedAt time.Time `json:"updated_at"`
}

type ProductImage struct {
	ID        int64     `json:"id"`
	ProductID int64     `json:"product_id"`
	Key       string    `json:"key"`
	URL       string    `json:"url"`
	Position  int       `json:"position"`
	CreatedAt time.Time `json:"created_at"`
}

type ListProductsFilter struct {
	CategoryID string
	PageSize   int32
	PageToken  string
}

// ProductWrite is the mutable field set for creating or updating a product (admin).
// id, timestamps, and images are managed elsewhere.
type ProductWrite struct {
	SKU         string          `json:"sku"`
	Slug        string          `json:"slug"`
	Name        string          `json:"name"`
	Brand       string          `json:"brand"`
	Description string          `json:"description"`
	CategoryID  string          `json:"category_id"`
	PriceCents  int64           `json:"price_cents"`
	Currency    string          `json:"currency"`
	Specs       json.RawMessage `json:"specs"`
	StockStatus StockStatus     `json:"stock_status"`
}
