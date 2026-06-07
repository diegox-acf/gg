// Raw DTOs returned by the gg-catalog REST API (snake_case, as serialized by Go).
// See gg-catalog/internal/catalog/model.go.

export type CatalogStockStatus = "in-stock" | "low-stock" | "out-of-stock";

export interface CatalogCategory {
  id: string;
  slug: string;
  label: string;
  icon: string;
  created_at: string;
}

export interface CatalogProduct {
  id: number;
  sku: string;
  slug: string;
  name: string;
  brand: string;
  description: string;
  category_id: string;
  price_cents: number;
  currency: string;
  specs: unknown;
  stock_status: CatalogStockStatus;
  created_at: string;
  updated_at: string;
}

export interface CatalogImage {
  id: number;
  product_id: number;
  key: string;
  url: string;
  position: number;
  created_at: string;
}
