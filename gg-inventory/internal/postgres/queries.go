package postgres

// Raw SQL lives here as package-level constants (no ORM). Scan order in
// rows.Scan(...) must exactly match the SELECT column order.

// reservation_id::text so pgx scans the UUID straight into a Go string.
const reservationCols = `
	id, reservation_id::text, order_id, product_id, quantity, status,
	idempotency_key, expires_at, created_at, updated_at`

const (
	queryGetStock = `
		SELECT product_id, available, reserved, version, updated_at
		FROM stock
		WHERE product_id = $1`

	// Optimistic read: no row lock. The CAS UPDATE below guards on the version
	// we read here; a concurrent writer bumps version and our UPDATE matches 0 rows.
	querySelectStock = `
		SELECT available, reserved, version
		FROM stock
		WHERE product_id = $1`

	// Compare-and-swap stock mutation. dAvailable/dReserved are signed deltas.
	// Guards: version must match (optimistic lock) and neither column may go
	// negative (defence in depth alongside the CHECK constraints).
	queryUpdateStockCAS = `
		UPDATE stock
		SET available  = available + $2,
		    reserved   = reserved  + $3,
		    version    = version + 1,
		    updated_at = NOW()
		WHERE product_id = $1
		  AND version    = $4
		  AND available + $2 >= 0
		  AND reserved  + $3 >= 0`

	querySelectReservationByKey = `
		SELECT ` + reservationCols + `
		FROM reservations
		WHERE idempotency_key = $1`

	querySelectReservationByUUID = `
		SELECT ` + reservationCols + `
		FROM reservations
		WHERE reservation_id = $1`

	queryInsertReservation = `
		INSERT INTO reservations
			(order_id, product_id, quantity, status, idempotency_key, expires_at)
		VALUES ($1, $2, $3, 'RESERVED', $4, $5)
		RETURNING ` + reservationCols

	queryUpdateReservationStatus = `
		UPDATE reservations
		SET status = $2, updated_at = NOW()
		WHERE id = $1`

	queryInsertOutbox = `
		INSERT INTO outbox
			(aggregate_type, aggregate_id, event_type, topic, payload, trace_id, traceparent)
		VALUES ('Reservation', $1, $2, $3, $4::jsonb, $5, $6)`

	// Outbox relay (Milestone C). Oldest-first batch of unpublished rows, claimed with
	// FOR UPDATE SKIP LOCKED so concurrent pollers take disjoint rows without blocking;
	// the lock is held until the surrounding tx commits (by which point the rows are
	// stamped published). payload::text so pgx scans JSONB straight into a Go string.
	querySelectUnpublishedOutbox = `
		SELECT id, event_id::text, aggregate_type, aggregate_id, event_type, topic,
		       payload::text, COALESCE(trace_id, ''), COALESCE(traceparent, ''), created_at
		FROM outbox
		WHERE published_at IS NULL
		ORDER BY created_at
		LIMIT $1
		FOR UPDATE SKIP LOCKED`

	queryMarkOutboxPublished = `
		UPDATE outbox SET published_at = NOW() WHERE id = $1`
)
