// Page-facing catalog data access. Each function calls the live Catalog service
// and falls back to mock data if it's unreachable — so the storefront still
// renders (and the build stays green) when the stack is down. Server-only.

import {
  CatalogNotFoundError,
  fetchCategories,
  fetchProductBySlug,
  fetchProducts,
} from "./client";
import { mapCategory, mapProduct } from "./mapper";
import {
  MOCK_CATEGORIES,
  MOCK_PRODUCTS,
  getProductBySlug as mockProductBySlug,
  getProductsByCategory as mockProductsByCategory,
  type MockCategory,
  type MockProduct,
} from "@/lib/mock-data";

async function withFallback<T>(
  label: string,
  fn: () => Promise<T>,
  fallback: T,
): Promise<T> {
  try {
    return await fn();
  } catch (err) {
    console.warn(
      `[catalog] ${label} failed — serving mock data:`,
      err instanceof Error ? err.message : err,
    );
    return fallback;
  }
}

export function getCategories(): Promise<MockCategory[]> {
  return withFallback(
    "getCategories",
    async () => {
      const { categories } = await fetchCategories();
      return (categories ?? []).map(mapCategory);
    },
    MOCK_CATEGORIES,
  );
}

export function getProducts(opts?: {
  categorySlug?: string;
  pageSize?: number;
}): Promise<MockProduct[]> {
  return withFallback(
    "getProducts",
    async () => {
      const { products } = await fetchProducts({
        categoryId: opts?.categorySlug,
        pageSize: opts?.pageSize,
      });
      return (products ?? []).map(mapProduct);
    },
    opts?.categorySlug
      ? mockProductsByCategory(opts.categorySlug)
      : MOCK_PRODUCTS,
  );
}

export async function getCategoryBySlug(
  slug: string,
): Promise<MockCategory | undefined> {
  const categories = await getCategories();
  return categories.find((c) => c.slug === slug);
}

export async function getProductBySlug(
  slug: string,
): Promise<MockProduct | null> {
  try {
    const { product } = await fetchProductBySlug(slug);
    return product ? mapProduct(product) : null;
  } catch (err) {
    // A live 404 is authoritative: the product is gone → let the page 404.
    // Falling back to mock here would resurrect stale slugs (see Phase 1 bug).
    if (err instanceof CatalogNotFoundError) return null;
    // Transport failure (unreachable / timeout / 5xx): degrade to mock so the
    // storefront still renders when the stack is down.
    console.warn(
      "[catalog] getProductBySlug failed — serving mock data:",
      err instanceof Error ? err.message : err,
    );
    return mockProductBySlug(slug) ?? null;
  }
}

export async function getRelatedProducts(
  product: MockProduct,
  limit = 4,
): Promise<MockProduct[]> {
  const list = await getProducts({ categorySlug: product.categorySlug });
  return list.filter((p) => p.id !== product.id).slice(0, limit);
}
