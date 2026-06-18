package postgres

import (
	"context"
	"errors"
	"os"
	"path/filepath"
	"sync"
	"sync/atomic"
	"testing"
	"time"

	"github.com/diegox-acf/gg-inventory/internal/inventory"
	"github.com/jackc/pgx/v5/pgxpool"
	"github.com/stretchr/testify/require"
	"github.com/testcontainers/testcontainers-go"
	tcpostgres "github.com/testcontainers/testcontainers-go/modules/postgres"
	"github.com/testcontainers/testcontainers-go/wait"
)

// setupRepo spins a real Postgres in Docker, applies the schema migrations, and
// seeds two stock rows: product 1 (available 5) and product 2 (available 1).
func setupRepo(t *testing.T) (*Repository, *pgxpool.Pool) {
	t.Helper()
	if testing.Short() {
		t.Skip("integration test requires Docker; skipped in -short mode")
	}
	ctx := context.Background()

	container, err := tcpostgres.Run(ctx, "postgres:17-alpine",
		tcpostgres.WithDatabase("gg_inventory"),
		tcpostgres.WithUsername("postgres"),
		tcpostgres.WithPassword("postgres"),
		testcontainers.WithWaitStrategy(
			wait.ForListeningPort("5432/tcp").WithStartupTimeout(60*time.Second),
		),
	)
	require.NoError(t, err)
	t.Cleanup(func() { _ = container.Terminate(ctx) })

	connStr, err := container.ConnectionString(ctx, "sslmode=disable")
	require.NoError(t, err)

	pool, err := pgxpool.New(ctx, connStr)
	require.NoError(t, err)
	t.Cleanup(pool.Close)

	for _, f := range []string{
		"000001_create_stock.up.sql",
		"000002_create_reservations.up.sql",
		"000003_create_outbox.up.sql",
		"000004_outbox_traceparent.up.sql",
	} {
		sql, err := os.ReadFile(filepath.Join("..", "..", "migrations", f))
		require.NoError(t, err)
		_, err = pool.Exec(ctx, string(sql))
		require.NoError(t, err)
	}
	_, err = pool.Exec(ctx, "INSERT INTO stock (product_id, available, reserved) VALUES (1,5,0),(2,1,0)")
	require.NoError(t, err)

	return NewRepository(pool, 15), pool
}

func TestReserveCommitReleaseLifecycle(t *testing.T) {
	ctx := context.Background()
	repo, _ := setupRepo(t)

	// Reserve product 1 x2.
	res, err := repo.Reserve(ctx, inventory.ReserveRequest{
		OrderID:        10,
		IdempotencyKey: "A",
		Items:          []inventory.ReservationItem{{ProductID: 1, Quantity: 2}},
	})
	require.NoError(t, err)
	require.Len(t, res, 1)
	require.Equal(t, inventory.ReservationReserved, res[0].Status)

	st, err := repo.GetStock(ctx, 1)
	require.NoError(t, err)
	require.Equal(t, 3, st.Available)
	require.Equal(t, 2, st.Reserved)

	// Idempotent replay: same reservation_id, stock unchanged.
	res2, err := repo.Reserve(ctx, inventory.ReserveRequest{
		OrderID:        10,
		IdempotencyKey: "A",
		Items:          []inventory.ReservationItem{{ProductID: 1, Quantity: 2}},
	})
	require.NoError(t, err)
	require.Equal(t, res[0].ReservationID, res2[0].ReservationID)
	st, _ = repo.GetStock(ctx, 1)
	require.Equal(t, 3, st.Available)
	require.Equal(t, 2, st.Reserved)

	// Commit: reserved 2 -> 0, available unchanged.
	committed, err := repo.Commit(ctx, res[0].ReservationID)
	require.NoError(t, err)
	require.Equal(t, inventory.ReservationCommitted, committed.Status)
	st, _ = repo.GetStock(ctx, 1)
	require.Equal(t, 3, st.Available)
	require.Equal(t, 0, st.Reserved)

	// Idempotent commit is a no-op success.
	_, err = repo.Commit(ctx, res[0].ReservationID)
	require.NoError(t, err)

	// Release path: reserve x1 then release returns it to available.
	rel, err := repo.Reserve(ctx, inventory.ReserveRequest{
		OrderID:        11,
		IdempotencyKey: "C",
		Items:          []inventory.ReservationItem{{ProductID: 1, Quantity: 1}},
	})
	require.NoError(t, err)
	st, _ = repo.GetStock(ctx, 1)
	require.Equal(t, 2, st.Available)

	released, err := repo.Release(ctx, rel[0].ReservationID)
	require.NoError(t, err)
	require.Equal(t, inventory.ReservationReleased, released.Status)
	st, _ = repo.GetStock(ctx, 1)
	require.Equal(t, 3, st.Available)
	require.Equal(t, 0, st.Reserved)

	// Releasing a committed reservation is an invalid transition.
	_, err = repo.Release(ctx, res[0].ReservationID)
	require.ErrorIs(t, err, inventory.ErrInvalidTransition)
}

func TestSweepExpiredReservations(t *testing.T) {
	ctx := context.Background()
	_, pool := setupRepo(t)
	// A repo with a negative TTL stamps expires_at in the past, so the reservation is
	// immediately sweepable — no waiting in the test.
	repo := NewRepository(pool, -1)
	svc := inventory.NewService(repo)

	res, err := repo.Reserve(ctx, inventory.ReserveRequest{
		OrderID:        30,
		IdempotencyKey: "SWEEP",
		Items:          []inventory.ReservationItem{{ProductID: 1, Quantity: 2}},
	})
	require.NoError(t, err)
	require.Equal(t, inventory.ReservationReserved, res[0].Status)
	st, _ := repo.GetStock(ctx, 1)
	require.Equal(t, 3, st.Available)
	require.Equal(t, 2, st.Reserved)

	// Sweep: the expired reservation is EXPIRED and its stock returns to the pool.
	n, err := svc.SweepExpiredReservations(ctx, 100)
	require.NoError(t, err)
	require.Equal(t, 1, n)

	st, _ = repo.GetStock(ctx, 1)
	require.Equal(t, 5, st.Available)
	require.Equal(t, 0, st.Reserved)

	var status string
	require.NoError(t, pool.QueryRow(ctx,
		"SELECT status FROM reservations WHERE reservation_id = $1", res[0].ReservationID).Scan(&status))
	require.Equal(t, "EXPIRED", status)

	// A StockExpired outbox event was written (in the same tx as the expiry).
	var eventType string
	require.NoError(t, pool.QueryRow(ctx,
		"SELECT event_type FROM outbox WHERE aggregate_id = $1 AND event_type = 'StockExpired'",
		res[0].ID).Scan(&eventType))
	require.Equal(t, "StockExpired", eventType)

	// Idempotent: nothing left to sweep.
	n, err = svc.SweepExpiredReservations(ctx, 100)
	require.NoError(t, err)
	require.Equal(t, 0, n)
}

func TestReserveInsufficientStockIsAtomic(t *testing.T) {
	ctx := context.Background()
	repo, _ := setupRepo(t)

	// Multi-item request where the second item can't be satisfied: the whole
	// request must roll back, leaving the first item's stock untouched.
	_, err := repo.Reserve(ctx, inventory.ReserveRequest{
		OrderID:        20,
		IdempotencyKey: "B",
		Items: []inventory.ReservationItem{
			{ProductID: 1, Quantity: 1},
			{ProductID: 2, Quantity: 999},
		},
	})
	require.ErrorIs(t, err, inventory.ErrInsufficientStock)

	st1, _ := repo.GetStock(ctx, 1)
	require.Equal(t, 5, st1.Available, "product 1 must be untouched after rollback")
	require.Equal(t, 0, st1.Reserved)
	st2, _ := repo.GetStock(ctx, 2)
	require.Equal(t, 1, st2.Available)
}

func TestReserveConcurrencyNoOversell(t *testing.T) {
	ctx := context.Background()
	repo, _ := setupRepo(t)

	// Product 2 has exactly 1 unit. Fire many concurrent single-unit reservations
	// with distinct keys; the optimistic lock must allow exactly one to win.
	const n = 16
	var success int32
	var wg sync.WaitGroup
	for i := 0; i < n; i++ {
		wg.Add(1)
		go func(i int) {
			defer wg.Done()
			_, err := repo.Reserve(ctx, inventory.ReserveRequest{
				OrderID:        int64(100 + i),
				IdempotencyKey: "RACE-" + string(rune('a'+i)),
				Items:          []inventory.ReservationItem{{ProductID: 2, Quantity: 1}},
			})
			if err == nil {
				atomic.AddInt32(&success, 1)
				return
			}
			// Losers must fail cleanly (no stock, or version contention).
			require.True(t,
				errors.Is(err, inventory.ErrInsufficientStock) || errors.Is(err, inventory.ErrStockConflict),
				"unexpected error: %v", err)
		}(i)
	}
	wg.Wait()

	require.Equal(t, int32(1), success, "exactly one reservation should succeed")
	st, _ := repo.GetStock(ctx, 2)
	require.Equal(t, 0, st.Available)
	require.Equal(t, 1, st.Reserved)
}
