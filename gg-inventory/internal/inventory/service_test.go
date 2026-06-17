package inventory

import (
	"context"
	"errors"
	"testing"
)

// stubRepo records whether it was invoked and returns canned values. Validation
// failures must never reach the repository.
type stubRepo struct {
	called      bool
	reservation *Reservation
}

func (s *stubRepo) GetStock(context.Context, int64) (*Stock, error) {
	s.called = true
	return &Stock{}, nil
}

func (s *stubRepo) Reserve(context.Context, ReserveRequest) ([]*Reservation, error) {
	s.called = true
	return []*Reservation{s.reservation}, nil
}

func (s *stubRepo) Commit(context.Context, string) (*Reservation, error) {
	s.called = true
	return s.reservation, nil
}

func (s *stubRepo) Release(context.Context, string) (*Reservation, error) {
	s.called = true
	return s.reservation, nil
}

func (s *stubRepo) ReservationIDsByOrder(context.Context, int64) ([]string, error) {
	s.called = true
	if s.reservation == nil {
		return nil, nil
	}
	return []string{s.reservation.ReservationID}, nil
}

func TestReserveValidation(t *testing.T) {
	valid := ReserveRequest{
		OrderID:        1,
		IdempotencyKey: "k",
		Items:          []ReservationItem{{ProductID: 1, Quantity: 2}},
	}

	cases := []struct {
		name       string
		req        ReserveRequest
		wantErr    bool
		wantCalled bool
	}{
		{"valid", valid, false, true},
		{"zero order id", ReserveRequest{OrderID: 0, IdempotencyKey: "k", Items: valid.Items}, true, false},
		{"missing key", ReserveRequest{OrderID: 1, Items: valid.Items}, true, false},
		{"no items", ReserveRequest{OrderID: 1, IdempotencyKey: "k"}, true, false},
		{"zero quantity", ReserveRequest{OrderID: 1, IdempotencyKey: "k", Items: []ReservationItem{{ProductID: 1, Quantity: 0}}}, true, false},
		{"negative quantity", ReserveRequest{OrderID: 1, IdempotencyKey: "k", Items: []ReservationItem{{ProductID: 1, Quantity: -1}}}, true, false},
		{"zero product id", ReserveRequest{OrderID: 1, IdempotencyKey: "k", Items: []ReservationItem{{ProductID: 0, Quantity: 1}}}, true, false},
		{"duplicate product", ReserveRequest{OrderID: 1, IdempotencyKey: "k", Items: []ReservationItem{{ProductID: 1, Quantity: 1}, {ProductID: 1, Quantity: 1}}}, true, false},
	}

	for _, tc := range cases {
		t.Run(tc.name, func(t *testing.T) {
			repo := &stubRepo{reservation: &Reservation{}}
			svc := NewService(repo)

			_, err := svc.Reserve(context.Background(), tc.req)

			gotErr := err != nil
			if gotErr != tc.wantErr {
				t.Fatalf("error = %v, wantErr = %v", err, tc.wantErr)
			}
			if tc.wantErr && !errors.Is(err, ErrInvalidRequest) {
				t.Fatalf("error = %v, want ErrInvalidRequest", err)
			}
			if repo.called != tc.wantCalled {
				t.Fatalf("repo called = %v, want %v", repo.called, tc.wantCalled)
			}
		})
	}
}

func TestGetStockValidation(t *testing.T) {
	repo := &stubRepo{}
	svc := NewService(repo)
	if _, err := svc.GetStock(context.Background(), 0); !errors.Is(err, ErrInvalidRequest) {
		t.Fatalf("GetStock(0) error = %v, want ErrInvalidRequest", err)
	}
	if repo.called {
		t.Fatal("repo should not be called on invalid input")
	}
}

func TestCommitReleaseValidation(t *testing.T) {
	repo := &stubRepo{}
	svc := NewService(repo)
	if _, err := svc.Commit(context.Background(), ""); !errors.Is(err, ErrInvalidRequest) {
		t.Fatalf("Commit(\"\") error = %v, want ErrInvalidRequest", err)
	}
	if _, err := svc.Release(context.Background(), ""); !errors.Is(err, ErrInvalidRequest) {
		t.Fatalf("Release(\"\") error = %v, want ErrInvalidRequest", err)
	}
	if repo.called {
		t.Fatal("repo should not be called on invalid input")
	}
}
