package catalog

import "context"

// Repository is the port that the domain layer requires from any persistence adapter.
// The postgres package provides the primary implementation.
type Repository interface {
	ListProducts(ctx context.Context, filter ListProductsFilter) ([]*Product, string, error)
	GetProduct(ctx context.Context, id int64) (*Product, error)
	GetProductBySlug(ctx context.Context, slug string) (*Product, error)
	GetProductsByIDs(ctx context.Context, ids []int64) ([]*Product, error)
	ListCategories(ctx context.Context) ([]*Category, error)
}
