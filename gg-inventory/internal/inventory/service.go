package inventory

import (
	"context"
	"fmt"
)

// Service holds the inventory business rules. Handlers contain none; the postgres
// adapter owns transactions but not policy.
type Service struct {
	repo Repository
}

func NewService(repo Repository) *Service {
	return &Service{repo: repo}
}

func (s *Service) GetStock(ctx context.Context, productID int64) (*Stock, error) {
	if productID <= 0 {
		return nil, fmt.Errorf("%w: product_id must be positive", ErrInvalidRequest)
	}
	return s.repo.GetStock(ctx, productID)
}

// Reserve validates the request and delegates the atomic reservation to the repo.
func (s *Service) Reserve(ctx context.Context, req ReserveRequest) ([]*Reservation, error) {
	if req.OrderID <= 0 {
		return nil, fmt.Errorf("%w: order_id must be positive", ErrInvalidRequest)
	}
	if req.IdempotencyKey == "" {
		return nil, fmt.Errorf("%w: idempotency_key is required", ErrInvalidRequest)
	}
	if len(req.Items) == 0 {
		return nil, fmt.Errorf("%w: at least one item is required", ErrInvalidRequest)
	}
	seen := make(map[int64]struct{}, len(req.Items))
	for _, item := range req.Items {
		if item.ProductID <= 0 {
			return nil, fmt.Errorf("%w: product_id must be positive", ErrInvalidRequest)
		}
		if item.Quantity <= 0 {
			return nil, fmt.Errorf("%w: quantity must be positive", ErrInvalidRequest)
		}
		if _, dup := seen[item.ProductID]; dup {
			return nil, fmt.Errorf("%w: duplicate product_id %d", ErrInvalidRequest, item.ProductID)
		}
		seen[item.ProductID] = struct{}{}
	}
	return s.repo.Reserve(ctx, req)
}

func (s *Service) Commit(ctx context.Context, reservationID string) (*Reservation, error) {
	if reservationID == "" {
		return nil, fmt.Errorf("%w: reservation_id is required", ErrInvalidRequest)
	}
	return s.repo.Commit(ctx, reservationID)
}

func (s *Service) Release(ctx context.Context, reservationID string) (*Reservation, error) {
	if reservationID == "" {
		return nil, fmt.Errorf("%w: reservation_id is required", ErrInvalidRequest)
	}
	return s.repo.Release(ctx, reservationID)
}
