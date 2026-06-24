package inventory

import "context"

// Repository is the port the domain layer requires from any persistence adapter.
// The postgres package provides the primary implementation.
//
// Reserve/Commit/Release are inherently transactional (a stock mutation, a
// reservation row change, and an outbox write must commit atomically), so the
// adapter owns the transaction boundary. The service layer owns validation,
// idempotency intent, and error translation.
type Repository interface {
	GetStock(ctx context.Context, productID int64) (*Stock, error)

	// ListStock returns a page of stock rows (ordered by product_id) plus the total
	// row count, for the admin console. Read-only; no transaction needed.
	ListStock(ctx context.Context, filter StockListFilter) (*StockPage, error)

	// Restock increases a product's available stock by quantity in one transaction
	// (CAS) and writes a StockRestocked outbox event. Returns the updated stock; an
	// unknown product yields pgx.ErrNoRows.
	Restock(ctx context.Context, productID int64, quantity int) (*Stock, error)

	// Reserve reserves every item of the request in a single transaction, writing
	// a reservation row + a StockReserved outbox event per item. It is idempotent
	// on the request's idempotency key: replaying returns the existing rows without
	// mutating stock. Returns ErrInsufficientStock if any item cannot be satisfied.
	Reserve(ctx context.Context, req ReserveRequest) ([]*Reservation, error)

	// Commit transitions a RESERVED reservation to COMMITTED (reserved -= qty) and
	// writes a StockCommitted outbox event. Idempotent: committing an already
	// COMMITTED reservation is a no-op success.
	Commit(ctx context.Context, reservationID string) (*Reservation, error)

	// Release transitions a RESERVED reservation to RELEASED (available += qty,
	// reserved -= qty) and writes a StockReleased outbox event. Idempotent:
	// releasing an already RELEASED reservation is a no-op success.
	Release(ctx context.Context, reservationID string) (*Reservation, error)

	// ReservationIDsByOrder returns the reservation ids still RESERVED for an order,
	// used to commit/release a whole order on its terminal Kafka event.
	ReservationIDsByOrder(ctx context.Context, orderID int64) ([]string, error)

	// Expire transitions a RESERVED reservation to EXPIRED (same stock effect as Release)
	// and writes a StockExpired outbox event. The reservation sweeper uses this for rows
	// past their TTL. Idempotent: a reservation already terminal is left unchanged.
	Expire(ctx context.Context, reservationID string) (*Reservation, error)

	// ExpiredReservationIDs returns up to limit reservation ids still RESERVED past their
	// expires_at — the sweeper's work set.
	ExpiredReservationIDs(ctx context.Context, limit int) ([]string, error)
}
