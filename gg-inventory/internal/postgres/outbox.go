package postgres

import (
	"context"
	"fmt"
	"time"

	"github.com/jackc/pgx/v5/pgxpool"
)

// OutboxRecord is one row of the transactional outbox, as read by the relay.
type OutboxRecord struct {
	ID            int64
	EventID       string
	AggregateType string
	AggregateID   int64
	EventType     string
	Topic         string
	Payload       string // raw JSON
	TraceID       string
	TraceParent   string
	CreatedAt     time.Time
}

// OutboxRelay reads unpublished outbox rows and stamps them published. The Kafka send
// itself lives in the events package; Relay bridges the two so the publish and the
// published_at update happen inside one transaction (at-least-once, ADR-019).
type OutboxRelay struct {
	pool *pgxpool.Pool
}

func NewOutboxRelay(pool *pgxpool.Pool) *OutboxRelay {
	return &OutboxRelay{pool: pool}
}

// Relay claims up to batchSize unpublished rows (FOR UPDATE SKIP LOCKED), calls publish
// for each, and marks it published — all in one transaction. If publish returns an error
// the whole transaction rolls back, so nothing is marked published and the batch is
// retried next cycle (a duplicate is possible, a loss is not). Returns the number of rows
// published.
func (r *OutboxRelay) Relay(
	ctx context.Context,
	batchSize int,
	publish func(context.Context, OutboxRecord) error,
) (int, error) {
	tx, err := r.pool.Begin(ctx)
	if err != nil {
		return 0, fmt.Errorf("begin tx: %w", err)
	}
	defer tx.Rollback(ctx) // no-op once committed

	rows, err := tx.Query(ctx, querySelectUnpublishedOutbox, batchSize)
	if err != nil {
		return 0, fmt.Errorf("select unpublished outbox: %w", err)
	}
	var batch []OutboxRecord
	for rows.Next() {
		var rec OutboxRecord
		if err := rows.Scan(
			&rec.ID, &rec.EventID, &rec.AggregateType, &rec.AggregateID, &rec.EventType,
			&rec.Topic, &rec.Payload, &rec.TraceID, &rec.TraceParent, &rec.CreatedAt,
		); err != nil {
			rows.Close()
			return 0, fmt.Errorf("scan outbox row: %w", err)
		}
		batch = append(batch, rec)
	}
	rows.Close()
	if err := rows.Err(); err != nil {
		return 0, fmt.Errorf("iterate outbox rows: %w", err)
	}

	for _, rec := range batch {
		if err := publish(ctx, rec); err != nil {
			return 0, fmt.Errorf("publish outbox id=%d: %w", rec.ID, err)
		}
		if _, err := tx.Exec(ctx, queryMarkOutboxPublished, rec.ID); err != nil {
			return 0, fmt.Errorf("mark published id=%d: %w", rec.ID, err)
		}
	}

	if err := tx.Commit(ctx); err != nil {
		return 0, fmt.Errorf("commit tx: %w", err)
	}
	return len(batch), nil
}
