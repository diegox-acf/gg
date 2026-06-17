package postgres

import (
	"context"
	"encoding/json"
	"errors"
	"fmt"
	"time"

	"github.com/diegox-acf/gg-inventory/internal/inventory"
	"github.com/jackc/pgx/v5"
	"github.com/jackc/pgx/v5/pgxpool"
	"go.opentelemetry.io/otel/trace"
)

// maxCASAttempts bounds optimistic-lock retries on a single stock row before we
// give up with ErrStockConflict. Conflicts are rare and resolve immediately (the
// competing transaction has already committed), so a small ceiling is plenty.
const maxCASAttempts = 5

// Event types and the topics they publish to (see gg-docs/09-data-model.md).
const (
	eventStockReserved  = "StockReserved"
	eventStockCommitted = "StockCommitted"
	eventStockReleased  = "StockReleased"

	topicStockReserved = "inventory.stock-reserved"
	topicStockReleased = "inventory.stock-released"
)

type Repository struct {
	pool       *pgxpool.Pool
	ttlMinutes int
}

func NewRepository(pool *pgxpool.Pool, reservationTTLMinutes int) *Repository {
	return &Repository{pool: pool, ttlMinutes: reservationTTLMinutes}
}

func (r *Repository) GetStock(ctx context.Context, productID int64) (*inventory.Stock, error) {
	s := &inventory.Stock{}
	err := r.pool.QueryRow(ctx, queryGetStock, productID).Scan(
		&s.ProductID, &s.Available, &s.Reserved, &s.Version, &s.UpdatedAt,
	)
	if err != nil {
		return nil, fmt.Errorf("get stock %d: %w", productID, err)
	}
	return s, nil
}

// Reserve reserves every item atomically (single transaction). Replaying the same
// idempotency key returns the existing reservations without touching stock.
func (r *Repository) Reserve(ctx context.Context, req inventory.ReserveRequest) ([]*inventory.Reservation, error) {
	tx, err := r.pool.Begin(ctx)
	if err != nil {
		return nil, fmt.Errorf("begin tx: %w", err)
	}
	defer tx.Rollback(ctx) // no-op once committed

	out := make([]*inventory.Reservation, 0, len(req.Items))
	for _, item := range req.Items {
		// One reservation row per (request, product); the derived key keeps the
		// per-row idempotency_key UNIQUE while making the whole request replayable.
		derivedKey := fmt.Sprintf("%s:%d", req.IdempotencyKey, item.ProductID)

		existing, err := scanReservation(tx.QueryRow(ctx, querySelectReservationByKey, derivedKey))
		if err == nil {
			out = append(out, existing) // idempotent replay
			continue
		}
		if !errors.Is(err, pgx.ErrNoRows) {
			return nil, fmt.Errorf("lookup reservation: %w", err)
		}

		// New reservation: available -= qty, reserved += qty.
		if err := r.applyStockDelta(ctx, tx, item.ProductID, -item.Quantity, item.Quantity); err != nil {
			return nil, err
		}

		res, err := scanReservation(tx.QueryRow(ctx, queryInsertReservation,
			req.OrderID, item.ProductID, item.Quantity, derivedKey, r.expiry(),
		))
		if err != nil {
			return nil, fmt.Errorf("insert reservation: %w", err)
		}

		if err := writeOutbox(ctx, tx, res.ID, eventStockReserved, topicStockReserved, res); err != nil {
			return nil, err
		}
		out = append(out, res)
	}

	if err := tx.Commit(ctx); err != nil {
		return nil, fmt.Errorf("commit tx: %w", err)
	}
	return out, nil
}

func (r *Repository) Commit(ctx context.Context, reservationID string) (*inventory.Reservation, error) {
	// Commit: reserved -= qty, available unchanged (already decremented at reserve).
	return r.transition(ctx, reservationID, inventory.ReservationCommitted, false,
		eventStockCommitted, topicStockReserved)
}

func (r *Repository) Release(ctx context.Context, reservationID string) (*inventory.Reservation, error) {
	// Release: available += qty, reserved -= qty (stock returns to the pool).
	return r.transition(ctx, reservationID, inventory.ReservationReleased, true,
		eventStockReleased, topicStockReleased)
}

// transition moves a RESERVED reservation to target, adjusting stock and emitting
// an outbox event in one transaction. Idempotent: a reservation already in the
// target state is returned unchanged.
func (r *Repository) transition(
	ctx context.Context,
	reservationID string,
	target inventory.ReservationStatus,
	returnToAvailable bool,
	eventType, topic string,
) (*inventory.Reservation, error) {
	tx, err := r.pool.Begin(ctx)
	if err != nil {
		return nil, fmt.Errorf("begin tx: %w", err)
	}
	defer tx.Rollback(ctx)

	res, err := scanReservation(tx.QueryRow(ctx, querySelectReservationByUUID, reservationID))
	if errors.Is(err, pgx.ErrNoRows) {
		return nil, inventory.ErrReservationNotFound
	}
	if err != nil {
		return nil, fmt.Errorf("lookup reservation: %w", err)
	}

	if res.Status == target {
		return res, nil // idempotent no-op
	}
	if res.Status != inventory.ReservationReserved {
		return nil, fmt.Errorf("%w: %s -> %s", inventory.ErrInvalidTransition, res.Status, target)
	}

	dAvail := 0
	if returnToAvailable {
		dAvail = res.Quantity
	}
	if err := r.applyStockDelta(ctx, tx, res.ProductID, dAvail, -res.Quantity); err != nil {
		return nil, err
	}

	if _, err := tx.Exec(ctx, queryUpdateReservationStatus, res.ID, string(target)); err != nil {
		return nil, fmt.Errorf("update reservation status: %w", err)
	}

	res.Status = target
	if err := writeOutbox(ctx, tx, res.ID, eventType, topic, res); err != nil {
		return nil, err
	}

	if err := tx.Commit(ctx); err != nil {
		return nil, fmt.Errorf("commit tx: %w", err)
	}
	return res, nil
}

// applyStockDelta applies signed deltas to a stock row using optimistic locking:
// read the version, then CAS-update guarding on it. A 0-row update means a
// concurrent writer bumped the version, so we re-read and retry. A would-be
// negative balance returns ErrInsufficientStock without retrying.
func (r *Repository) applyStockDelta(ctx context.Context, tx pgx.Tx, productID int64, dAvail, dReserved int) error {
	for attempt := 0; attempt < maxCASAttempts; attempt++ {
		var avail, reserved int
		var version int64
		err := tx.QueryRow(ctx, querySelectStock, productID).Scan(&avail, &reserved, &version)
		if errors.Is(err, pgx.ErrNoRows) {
			return inventory.ErrInsufficientStock // unknown product = nothing to reserve
		}
		if err != nil {
			return fmt.Errorf("select stock %d: %w", productID, err)
		}
		if avail+dAvail < 0 {
			return inventory.ErrInsufficientStock
		}
		if reserved+dReserved < 0 {
			return fmt.Errorf("reserved would go negative for product %d", productID)
		}

		tag, err := tx.Exec(ctx, queryUpdateStockCAS, productID, dAvail, dReserved, version)
		if err != nil {
			return fmt.Errorf("cas stock %d: %w", productID, err)
		}
		if tag.RowsAffected() == 1 {
			return nil
		}
		// Version conflict: another transaction committed first. Brief backoff, retry.
		time.Sleep(time.Duration(attempt+1) * time.Millisecond)
	}
	return inventory.ErrStockConflict
}

func (r *Repository) expiry() time.Time {
	return time.Now().Add(time.Duration(r.ttlMinutes) * time.Minute)
}

// writeOutbox appends a domain event in the same transaction as the state change
// (transactional outbox, ADR-006). The events.Poller ships these to Kafka. The full
// traceparent is captured (not just trace_id) so the poller can re-establish this span's
// context and chain the produced Kafka span into the same trace.
func writeOutbox(ctx context.Context, tx pgx.Tx, aggregateID int64, eventType, topic string, res *inventory.Reservation) error {
	payload, err := json.Marshal(map[string]any{
		"reservation_id": res.ReservationID,
		"order_id":       res.OrderID,
		"product_id":     res.ProductID,
		"quantity":       res.Quantity,
		"status":         res.Status,
	})
	if err != nil {
		return fmt.Errorf("marshal outbox payload: %w", err)
	}

	if _, err := tx.Exec(ctx, queryInsertOutbox,
		aggregateID, eventType, topic, string(payload),
		nullable(traceIDFromContext(ctx)), nullable(traceparentFromContext(ctx)),
	); err != nil {
		return fmt.Errorf("write outbox %s: %w", eventType, err)
	}
	return nil
}

// nullable maps "" to a SQL NULL so empty trace fields aren't stored as empty strings.
func nullable(s string) any {
	if s == "" {
		return nil
	}
	return s
}

// scanner is satisfied by both pgx.Row and pgx.Rows.
type scanner interface {
	Scan(dest ...any) error
}

func scanReservation(s scanner) (*inventory.Reservation, error) {
	res := &inventory.Reservation{}
	var status string
	if err := s.Scan(
		&res.ID, &res.ReservationID, &res.OrderID, &res.ProductID, &res.Quantity,
		&status, &res.IdempotencyKey, &res.ExpiresAt, &res.CreatedAt, &res.UpdatedAt,
	); err != nil {
		return nil, err
	}
	res.Status = inventory.ReservationStatus(status)
	return res, nil
}

func traceIDFromContext(ctx context.Context) string {
	sc := trace.SpanContextFromContext(ctx)
	if sc.HasTraceID() {
		return sc.TraceID().String()
	}
	return ""
}

// traceparentFromContext renders the active span as a W3C traceparent
// (00-<trace>-<span>-<flags>), or "" when no valid span is present.
func traceparentFromContext(ctx context.Context) string {
	sc := trace.SpanContextFromContext(ctx)
	if !sc.IsValid() {
		return ""
	}
	return fmt.Sprintf("00-%s-%s-%02x", sc.TraceID(), sc.SpanID(), byte(sc.TraceFlags()))
}
