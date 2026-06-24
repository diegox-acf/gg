package postgres

import (
	"context"
	"testing"

	"github.com/jackc/pgx/v5"
	"github.com/stretchr/testify/require"
)

// setupRepo seeds product 1 (available 5) and product 2 (available 1).
func TestRestock(t *testing.T) {
	repo, pool := setupRepo(t)
	ctx := context.Background()

	s, err := repo.Restock(ctx, 1, 10)
	require.NoError(t, err)
	require.Equal(t, 15, s.Available) // 5 + 10
	require.Equal(t, int64(1), s.Version)

	// A StockRestocked outbox event was written in the same transaction.
	var count int
	err = pool.QueryRow(ctx,
		"SELECT COUNT(*) FROM outbox WHERE event_type='StockRestocked' "+
			"AND topic='inventory.stock-released' AND aggregate_id=1",
	).Scan(&count)
	require.NoError(t, err)
	require.Equal(t, 1, count)

	// Unknown product → clean not-found.
	_, err = repo.Restock(ctx, 999999, 5)
	require.ErrorIs(t, err, pgx.ErrNoRows)
}
