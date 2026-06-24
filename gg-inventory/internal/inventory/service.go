package inventory

import (
	"context"
	"errors"
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

// ListStock returns a page of stock rows for the admin console. Read-only.
func (s *Service) ListStock(ctx context.Context, filter StockListFilter) (*StockPage, error) {
	if filter.Threshold < 0 {
		return nil, fmt.Errorf("%w: threshold must not be negative", ErrInvalidRequest)
	}
	return s.repo.ListStock(ctx, filter)
}

// Restock adds quantity (> 0) to a product's available stock (admin operation).
func (s *Service) Restock(ctx context.Context, productID int64, quantity int) (*Stock, error) {
	if productID <= 0 {
		return nil, fmt.Errorf("%w: product_id must be positive", ErrInvalidRequest)
	}
	if quantity <= 0 {
		return nil, fmt.Errorf("%w: quantity must be positive", ErrInvalidRequest)
	}
	return s.repo.Restock(ctx, productID, quantity)
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

// CommitOrder commits every still-RESERVED reservation of an order (driven by OrderConfirmed).
// Idempotent: a redelivery finds nothing RESERVED and is a no-op.
func (s *Service) CommitOrder(ctx context.Context, orderID int64) error {
	return s.applyToOrder(ctx, orderID, s.repo.Commit)
}

// ReleaseOrder releases every still-RESERVED reservation of an order (driven by OrderFailed).
// Idempotent in the same way as CommitOrder.
func (s *Service) ReleaseOrder(ctx context.Context, orderID int64) error {
	return s.applyToOrder(ctx, orderID, s.repo.Release)
}

// SweepExpiredReservations expires up to batchSize reservations still RESERVED past their TTL
// (D3 safety net for a saga that crashed and never sent a terminal event). Each expiry is its own
// transaction; a reservation the order's saga concurrently committed/released is skipped
// (ErrInvalidTransition / ErrReservationNotFound are benign here). Returns the number expired.
func (s *Service) SweepExpiredReservations(ctx context.Context, batchSize int) (int, error) {
	ids, err := s.repo.ExpiredReservationIDs(ctx, batchSize)
	if err != nil {
		return 0, err
	}
	expired := 0
	for _, id := range ids {
		switch _, err := s.repo.Expire(ctx, id); {
		case err == nil:
			expired++
		case errors.Is(err, ErrInvalidTransition), errors.Is(err, ErrReservationNotFound):
			// The order's saga won the race (commit/release) — nothing for the sweeper to do.
			continue
		default:
			return expired, err
		}
	}
	return expired, nil
}

func (s *Service) applyToOrder(
	ctx context.Context,
	orderID int64,
	op func(context.Context, string) (*Reservation, error),
) error {
	if orderID <= 0 {
		return fmt.Errorf("%w: order_id must be positive", ErrInvalidRequest)
	}
	ids, err := s.repo.ReservationIDsByOrder(ctx, orderID)
	if err != nil {
		return err
	}
	for _, id := range ids {
		if _, err := op(ctx, id); err != nil {
			return err
		}
	}
	return nil
}
