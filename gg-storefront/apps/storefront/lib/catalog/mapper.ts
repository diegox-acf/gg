// Maps gg-catalog DTOs to the UI view models the components already consume
// (MockProduct / MockCategory). The catalog API doesn't carry every display
// field (category description / product count), so those are enriched from the
// static catalog metadata where available.

import type { CatalogCategory, CatalogProduct } from "./types";
import {
  MOCK_CATEGORIES,
  type MockCategory,
  type MockProduct,
  type StockStatus,
} from "@/lib/mock-data";

const CATEGORY_META = new Map(MOCK_CATEGORIES.map((c) => [c.slug, c]));

export function mapProduct(p: CatalogProduct): MockProduct {
  return {
    id: String(p.id),
    sku: p.sku,
    slug: p.slug,
    name: p.name,
    brand: p.brand,
    description: p.description,
    categorySlug: p.category_id,
    priceCents: p.price_cents,
    stockStatus: p.stock_status as StockStatus,
    specs: normalizeSpecs(p.specs),
    imageUrl: p.image_url || undefined,
  };
}

// Catalog `specs` is a free-form JSONB blob (`unknown` on the wire). The UI only
// renders flat string→string pairs, so coerce values to strings and drop the
// rest rather than trusting the shape.
function normalizeSpecs(specs: unknown): Record<string, string> | undefined {
  if (!specs || typeof specs !== "object" || Array.isArray(specs)) return undefined;
  const out: Record<string, string> = {};
  for (const [key, value] of Object.entries(specs as Record<string, unknown>)) {
    if (value == null) continue;
    if (typeof value === "object") continue;
    out[key] = String(value);
  }
  return Object.keys(out).length > 0 ? out : undefined;
}

export function mapCategory(c: CatalogCategory): MockCategory {
  const meta = CATEGORY_META.get(c.slug);
  return {
    id: c.id,
    slug: c.slug,
    name: c.label,
    icon: c.icon || meta?.icon || "▣",
    description: meta?.description ?? "",
    productCount: meta?.productCount ?? 0,
  };
}
