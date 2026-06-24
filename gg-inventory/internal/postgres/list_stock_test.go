package postgres

import (
	"context"
	"testing"

	"github.com/diegox-acf/gg-inventory/internal/inventory"
	"github.com/stretchr/testify/require"
)

// setupRepo seeds product 1 (available 5) and product 2 (available 1).
func TestListStock(t *testing.T) {
	repo, _ := setupRepo(t)
	ctx := context.Background()

	all, err := repo.ListStock(ctx, inventory.StockListFilter{Limit: 20, Offset: 0})
	require.NoError(t, err)
	require.Equal(t, 2, all.Total)
	require.Len(t, all.Items, 2)
	require.Equal(t, int64(1), all.Items[0].ProductID) // ordered by product_id

	// Low-stock filter: only product 2 has available <= 1.
	low, err := repo.ListStock(ctx, inventory.StockListFilter{LowStock: true, Threshold: 1, Limit: 20})
	require.NoError(t, err)
	require.Equal(t, 1, low.Total)
	require.Len(t, low.Items, 1)
	require.Equal(t, int64(2), low.Items[0].ProductID)

	// Pagination: total reflects the full set even when the page is smaller.
	page0, err := repo.ListStock(ctx, inventory.StockListFilter{Limit: 1, Offset: 0})
	require.NoError(t, err)
	require.Equal(t, 2, page0.Total)
	require.Len(t, page0.Items, 1)
}
