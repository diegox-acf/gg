import "server-only";

import { adminHeaders } from "@/lib/api/admin-headers";

// Server-side client for the gg-catalog REST API. Reads are public; the admin write
// operations forward X-User-Roles (the backend guards them — ADR-022).

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
  description: string;
  category_id: string;
  price_cents: number;
  currency: string;
  specs: unknown;
  stock_status: CatalogStockStatus;
  image_url?: string;
}

// Mutable fields accepted by the admin create/update endpoints.
export interface ProductWrite {
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
}

export class CatalogWriteError extends Error {
  constructor(
    public readonly status: number,
    message: string,
  ) {
    super(message);
    this.name = "CatalogWriteError";
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

export function fetchProduct(id: number) {
  return getJSON<{ product: CatalogProduct }>(`/v1/products/${id}`);
}

// ── Admin writes (forward X-User-Roles; backend requires the admin role) ──

async function writeProduct(
  method: "POST" | "PUT",
  path: string,
  body: ProductWrite,
): Promise<CatalogProduct> {
  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), TIMEOUT_MS);
  try {
    const res = await fetch(`${BASE_URL}${path}`, {
      method,
      signal: controller.signal,
      cache: "no-store",
      headers: {
        "Content-Type": "application/json",
        Accept: "application/json",
        ...(await adminHeaders()),
      },
      body: JSON.stringify(body),
    });
    if (!res.ok) {
      const msg = await res
        .json()
        .then((d: { error?: string }) => d.error)
        .catch(() => undefined);
      throw new CatalogWriteError(res.status, msg ?? `catalog ${method} ${path} → ${res.status}`);
    }
    return ((await res.json()) as { product: CatalogProduct }).product;
  } finally {
    clearTimeout(timer);
  }
}

export function createProduct(body: ProductWrite) {
  return writeProduct("POST", "/v1/products", body);
}

export function updateProduct(id: number, body: ProductWrite) {
  return writeProduct("PUT", `/v1/products/${id}`, body);
}

export async function deleteProduct(id: number): Promise<void> {
  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), TIMEOUT_MS);
  try {
    const res = await fetch(`${BASE_URL}/v1/products/${id}`, {
      method: "DELETE",
      signal: controller.signal,
      cache: "no-store",
      headers: { Accept: "application/json", ...(await adminHeaders()) },
    });
    if (!res.ok && res.status !== 204) {
      throw new CatalogWriteError(res.status, `catalog DELETE /v1/products/${id} → ${res.status}`);
    }
  } finally {
    clearTimeout(timer);
  }
}
