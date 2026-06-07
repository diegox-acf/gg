// Server-side client for the gg-catalog REST API. This is the BFF's data-access
// layer — only import it from Server Components / Server Actions, never from
// client components. Uses `cache: "no-store"` so each request hits the service
// (per-request rendering — the shape that produces a browser→BFF→Catalog trace).

import type { CatalogCategory, CatalogProduct } from "./types";

const BASE_URL = process.env.CATALOG_API_URL ?? "http://localhost:8080";
const TIMEOUT_MS = 4000;

// Thrown when the Catalog answers authoritatively that a resource does not exist.
// Callers must distinguish this from a transport failure: a 404 is real data
// (→ notFound), whereas an unreachable service should degrade to mock data.
export class CatalogNotFoundError extends Error {
  constructor(path: string) {
    super(`catalog GET ${path} → 404`);
    this.name = "CatalogNotFoundError";
  }
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
    if (res.status === 404) {
      throw new CatalogNotFoundError(path);
    }
    if (!res.ok) {
      throw new Error(`catalog GET ${path} → ${res.status}`);
    }
    return (await res.json()) as T;
  } finally {
    clearTimeout(timer);
  }
}

export function fetchCategories() {
  return getJSON<{ categories: CatalogCategory[] | null }>("/v1/categories");
}

export function fetchProducts(params: {
  categoryId?: string;
  pageSize?: number;
  pageToken?: string;
}) {
  const qs = new URLSearchParams();
  if (params.categoryId) qs.set("category_id", params.categoryId);
  if (params.pageSize) qs.set("page_size", String(params.pageSize));
  if (params.pageToken) qs.set("page_token", params.pageToken);
  const query = qs.toString();
  return getJSON<{ products: CatalogProduct[] | null; next_page_token: string }>(
    `/v1/products${query ? `?${query}` : ""}`,
  );
}

export function fetchProductBySlug(slug: string) {
  return getJSON<{ product: CatalogProduct }>(
    `/v1/products/slug/${encodeURIComponent(slug)}`,
  );
}
