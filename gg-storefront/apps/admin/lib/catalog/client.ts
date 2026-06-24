import "server-only";

// Server-side client for the gg-catalog REST API (public reads; no auth needed).
// Mirrors the storefront's catalog client shapes (snake_case from the Go service).

const BASE_URL = process.env.CATALOG_API_URL ?? "http://localhost:8080";
const TIMEOUT_MS = 4000;

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
  category_id: string;
  price_cents: number;
  currency: string;
  stock_status: CatalogStockStatus;
  image_url?: string;
}

async function getJSON<T>(path: string): Promise<T> {
  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), TIMEOUT_MS);
  try {
    const res = await fetch(`${BASE_URL}${path}`, {
      signal: controller.signal,
      cache: "no-store",
      headers: { Accept: "application/json" },
    });
    if (!res.ok) throw new Error(`catalog GET ${path} → ${res.status}`);
    return (await res.json()) as T;
  } finally {
    clearTimeout(timer);
  }
}

export function fetchCategories() {
  return getJSON<{ categories: CatalogCategory[] | null }>("/v1/categories");
}

export function fetchProducts(params: { categoryId?: string; pageSize?: number } = {}) {
  const qs = new URLSearchParams();
  if (params.categoryId) qs.set("category_id", params.categoryId);
  if (params.pageSize) qs.set("page_size", String(params.pageSize));
  const q = qs.toString();
  return getJSON<{ products: CatalogProduct[] | null; next_page_token: string }>(
    `/v1/products${q ? `?${q}` : ""}`,
  );
}
