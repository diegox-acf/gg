package postgres

import (
	"context"
	"fmt"

	"github.com/jackc/pgx/v5/pgxpool"
)

// ConsumedEventStore records processed event ids for consumer-side idempotency (ADR-019).
// Kept separate from the domain Repository: dedup is consumer infrastructure, not inventory policy.
type ConsumedEventStore struct {
	pool *pgxpool.Pool
}

func NewConsumedEventStore(pool *pgxpool.Pool) *ConsumedEventStore {
	return &ConsumedEventStore{pool: pool}
}

func (s *ConsumedEventStore) IsConsumed(ctx context.Context, eventID string) (bool, error) {
	var exists bool
	if err := s.pool.QueryRow(ctx, queryIsEventConsumed, eventID).Scan(&exists); err != nil {
		return false, fmt.Errorf("check consumed event %s: %w", eventID, err)
	}
	return exists, nil
}

func (s *ConsumedEventStore) MarkConsumed(ctx context.Context, eventID, consumerGroup, topic string) error {
	if _, err := s.pool.Exec(ctx, queryMarkEventConsumed, eventID, consumerGroup, topic); err != nil {
		return fmt.Errorf("mark event %s consumed: %w", eventID, err)
	}
	return nil
}
