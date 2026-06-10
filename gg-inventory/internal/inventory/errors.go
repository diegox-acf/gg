package inventory

import "errors"

// Domain errors. The REST adapter maps these to HTTP status codes; callers never
// need to import the postgres driver to distinguish them.
var (
	// ErrInsufficientStock means one or more items cannot be reserved because
	// available < requested. The whole reserve request fails atomically.
	ErrInsufficientStock = errors.New("insufficient stock")

	// ErrReservationNotFound means no reservation matches the given reservation_id.
	ErrReservationNotFound = errors.New("reservation not found")

	// ErrInvalidTransition means a commit/release was attempted on a reservation
	// not in the RESERVED state (and not an idempotent no-op of the target state).
	ErrInvalidTransition = errors.New("invalid reservation state transition")

	// ErrStockConflict means optimistic-lock retries were exhausted under heavy
	// concurrent contention on the same stock row.
	ErrStockConflict = errors.New("stock version conflict, retries exhausted")

	// ErrInvalidRequest means the request failed domain validation.
	ErrInvalidRequest = errors.New("invalid request")
)
