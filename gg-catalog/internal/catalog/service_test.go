package catalog

import (
	"encoding/json"
	"testing"

	"github.com/stretchr/testify/require"
)

func TestValidateProductWrite(t *testing.T) {
	base := ProductWrite{
		SKU: "SKU-1", Slug: "rtx-5090", Name: "RTX 5090", Brand: "NVIDIA",
		CategoryID: "gpus", PriceCents: 199999,
	}

	t.Run("defaults are applied", func(t *testing.T) {
		out, err := validateProductWrite(base)
		require.NoError(t, err)
		require.Equal(t, "USD", out.Currency)
		require.Equal(t, json.RawMessage("{}"), out.Specs)
		require.Equal(t, StockStatusInStock, out.StockStatus)
	})

	t.Run("trims and preserves provided values", func(t *testing.T) {
		in := base
		in.Name = "  RTX 5090  "
		in.Currency = "EUR"
		in.Specs = json.RawMessage(`{"vram":"32GB"}`)
		in.StockStatus = StockStatusLowStock
		out, err := validateProductWrite(in)
		require.NoError(t, err)
		require.Equal(t, "RTX 5090", out.Name)
		require.Equal(t, "EUR", out.Currency)
		require.Equal(t, StockStatusLowStock, out.StockStatus)
	})

	missing := []struct {
		name  string
		mutfn func(p *ProductWrite)
	}{
		{"missing sku", func(p *ProductWrite) { p.SKU = "" }},
		{"missing slug", func(p *ProductWrite) { p.Slug = " " }},
		{"missing name", func(p *ProductWrite) { p.Name = "" }},
		{"missing brand", func(p *ProductWrite) { p.Brand = "" }},
		{"missing category", func(p *ProductWrite) { p.CategoryID = "" }},
	}
	for _, tc := range missing {
		t.Run(tc.name, func(t *testing.T) {
			in := base
			tc.mutfn(&in)
			_, err := validateProductWrite(in)
			require.ErrorIs(t, err, ErrInvalidProduct)
		})
	}

	t.Run("negative price rejected", func(t *testing.T) {
		in := base
		in.PriceCents = -1
		_, err := validateProductWrite(in)
		require.ErrorIs(t, err, ErrInvalidProduct)
	})

	t.Run("invalid specs JSON rejected", func(t *testing.T) {
		in := base
		in.Specs = json.RawMessage(`{not json`)
		_, err := validateProductWrite(in)
		require.ErrorIs(t, err, ErrInvalidProduct)
	})

	t.Run("invalid stock status rejected", func(t *testing.T) {
		in := base
		in.StockStatus = "discontinued"
		_, err := validateProductWrite(in)
		require.ErrorIs(t, err, ErrInvalidProduct)
	})
}
