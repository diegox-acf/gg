package catalog

import (
	"context"
	"fmt"
)

type Service struct {
	repo Repository
}

func NewService(repo Repository) *Service {
	return &Service{repo: repo}
}

func (s *Service) ListProducts(ctx context.Context, filter ListProductsFilter) ([]*Product, string, error) {
	if filter.PageSize <= 0 {
		filter.PageSize = 20
	}
	return s.repo.ListProducts(ctx, filter)
}

func (s *Service) GetProduct(ctx context.Context, id int64) (*Product, error) {
	if id <= 0 {
		return nil, fmt.Errorf("invalid product id: %d", id)
	}
	return s.repo.GetProduct(ctx, id)
}

func (s *Service) GetProductBySlug(ctx context.Context, slug string) (*Product, error) {
	if slug == "" {
		return nil, fmt.Errorf("slug is required")
	}
	return s.repo.GetProductBySlug(ctx, slug)
}

func (s *Service) GetProductsByIDs(ctx context.Context, ids []int64) ([]*Product, error) {
	if len(ids) == 0 {
		return nil, nil
	}
	return s.repo.GetProductsByIDs(ctx, ids)
}

func (s *Service) ListCategories(ctx context.Context) ([]*Category, error) {
	return s.repo.ListCategories(ctx)
}
