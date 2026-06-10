package inventory

import "time"

// ReservationStatus mirrors the CHECK constraint on reservations.status.
type ReservationStatus string

const (
	ReservationReserved  ReservationStatus = "RESERVED"
	ReservationCommitted ReservationStatus = "COMMITTED"
	ReservationReleased  ReservationStatus = "RELEASED"
	ReservationExpired   ReservationStatus = "EXPIRED"
)

// Stock is the authoritative available/reserved count for one product.
// available + reserved = total physical stock. version is the optimistic lock.
type Stock struct {
	ProductID int64     `json:"product_id"`
	Available int       `json:"available"`
	Reserved  int       `json:"reserved"`
	Version   int64     `json:"version"`
	UpdatedAt time.Time `json:"updated_at"`
}

// Reservation is one product's hold against an order. One row per (order_id,
// product_id); a single reserve request for a multi-item order produces several.
type Reservation struct {
	ID             int64             `json:"-"`
	ReservationID  string            `json:"reservation_id"`
	OrderID        int64             `json:"order_id"`
	ProductID      int64             `json:"product_id"`
	Quantity       int               `json:"quantity"`
	Status         ReservationStatus `json:"status"`
	IdempotencyKey string            `json:"-"`
	ExpiresAt      time.Time         `json:"expires_at"`
	CreatedAt      time.Time         `json:"created_at"`
	UpdatedAt      time.Time         `json:"updated_at"`
}

// ReservationItem is one line of a reserve request.
type ReservationItem struct {
	ProductID int64 `json:"product_id"`
	Quantity  int   `json:"quantity"`
}

// ReserveRequest reserves stock for every item of an order atomically.
type ReserveRequest struct {
	OrderID        int64             `json:"order_id"`
	Items          []ReservationItem `json:"items"`
	IdempotencyKey string            `json:"idempotency_key"`
}
