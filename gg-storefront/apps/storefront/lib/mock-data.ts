export type StockStatus = "in-stock" | "low-stock" | "out-of-stock";

export interface MockProduct {
  id: string;
  sku: string;
  slug: string;
  name: string;
  brand: string;
  description: string;
  categorySlug: string;
  priceCents: number;
  stockStatus: StockStatus;
  specs?: Record<string, string>;
  imageUrl?: string;
}

export interface MockCategory {
  id: string;
  slug: string;
  name: string;
  description: string;
  productCount: number;
  icon: string;
}

export function formatPrice(cents: number): string {
  return new Intl.NumberFormat("en-US", {
    style: "currency",
    currency: "USD",
  }).format(cents / 100);
}

// Categories + products live in a generated module (scripts/gen-catalog-seed.mjs).
// They are the *fallback* shown only when the catalog service is unreachable; the
// running app reads real data from gg-catalog.
export { MOCK_CATEGORIES, MOCK_PRODUCTS } from "./mock-catalog.generated";
import { MOCK_CATEGORIES, MOCK_PRODUCTS } from "./mock-catalog.generated";

export function getCategoryBySlug(slug: string): MockCategory | undefined {
  return MOCK_CATEGORIES.find((c) => c.slug === slug);
}

export function getProductsByCategory(categorySlug: string): MockProduct[] {
  return MOCK_PRODUCTS.filter((p) => p.categorySlug === categorySlug);
}

export function getProductBySlug(slug: string): MockProduct | undefined {
  return MOCK_PRODUCTS.find((p) => p.slug === slug);
}

export function getRelatedProducts(
  product: MockProduct,
  limit = 4,
): MockProduct[] {
  return MOCK_PRODUCTS.filter(
    (p) => p.categorySlug === product.categorySlug && p.id !== product.id,
  ).slice(0, limit);
}
