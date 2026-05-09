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
	CreatedAt   time.Time       `json:"created_at"`
	UpdatedAt   time.Time       `json:"updated_at"`
}

type ListProductsFilter struct {
	CategoryID string
	PageSize   int32
	PageToken  string
}
