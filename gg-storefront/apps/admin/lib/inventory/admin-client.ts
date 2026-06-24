import "server-only";

import { adminHeaders } from "@/lib/api/admin-headers";

// Server-side client for the gg-inventory admin API.

const BASE_URL = process.env.INVENTORY_API_URL ?? "http://localhost:8082";
const TIMEOUT_MS = 8000;

export interface Stock {
  product_id: number;
  available: number;
  reserved: number;
  version: number;
  updated_at: string;
}

export interface StockPage {
  items: Stock[];
  page: number;
  size: number;
  total_elements: number;
  total_pages: number;
}

async function getJSON<T>(path: string): Promise<T> {
  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), TIMEOUT_MS);
  try {
    const res = await fetch(`${BASE_URL}${path}`, {
      signal: controller.signal,
      cache: "no-store",
      headers: { Accept: "application/json", ...(await adminHeaders()) },
    });
    if (!res.ok) throw new Error(`inventory GET ${path} → ${res.status}`);
    return (await res.json()) as T;
  } finally {
    clearTimeout(timer);
  }
}

export function listStock(
  params: {
    lowStock?: boolean;
    threshold?: number;
    page?: number;
    size?: number;
  } = {},
): Promise<StockPage> {
  const qs = new URLSearchParams();
  if (params.lowStock) qs.set("low_stock", "true");
  if (params.threshold != null) qs.set("threshold", String(params.threshold));
  if (params.page != null) qs.set("page", String(params.page));
  if (params.size != null) qs.set("size", String(params.size));
  const q = qs.toString();
  return getJSON<StockPage>(`/admin/stock${q ? `?${q}` : ""}`);
}

/** Admin restock: increase a product's available stock by `quantity` (> 0). */
export async function restock(productId: number, quantity: number): Promise<Stock> {
  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), TIMEOUT_MS);
  try {
    const res = await fetch(`${BASE_URL}/admin/stock/${productId}/restock`, {
      method: "POST",
      signal: controller.signal,
      cache: "no-store",
      headers: {
        "Content-Type": "application/json",
        Accept: "application/json",
        ...(await adminHeaders()),
      },
      body: JSON.stringify({ quantity }),
    });
    if (!res.ok) throw new Error(`inventory restock ${productId} → ${res.status}`);
    return ((await res.json()) as { stock: Stock }).stock;
  } finally {
    clearTimeout(timer);
  }
}
