import "server-only";

import { adminHeaders } from "@/lib/api/admin-headers";

// Server-side client for the gg-orders admin API. Import only from Server Components.
// Outbound fetch is auto-instrumented by @vercel/otel, so admin→Orders joins the trace.

const BASE_URL = process.env.ORDERS_API_URL ?? "http://localhost:8083";
const TIMEOUT_MS = 8000;

export type OrderStatus =
  | "PENDING"
  | "RESERVING"
  | "PAYING"
  | "CONFIRMED"
  | "FAILED";

export interface OrderSummary {
  id: number;
  order_number: string;
  user_id: string;
  status: OrderStatus;
  total_cents: number;
  currency: string;
  created_at: string;
}

export interface OrderLineItem {
  product_id: number;
  sku: string;
  name: string;
  unit_price_cents: number;
  quantity: number;
  total_cents: number;
}

export interface OrderShipping {
  name: string;
  line1: string;
  line2?: string;
  city: string;
  state: string;
  postal_code: string;
  country: string;
}

export interface Order {
  id: number;
  order_number: string;
  user_id: string;
  status: OrderStatus;
  subtotal_cents: number;
  tax_cents: number;
  shipping_cents: number;
  total_cents: number;
  currency: string;
  items: OrderLineItem[];
  shipping: OrderShipping;
  created_at: string;
}

export interface PageResponse<T> {
  items: T[];
  page: number;
  size: number;
  total_elements: number;
  total_pages: number;
}

export interface OrderStats {
  total_orders: number;
  by_status: Record<string, number>;
  revenue_cents: number;
  orders_today: number;
}

export class OrderNotFoundError extends Error {
  constructor(id: number) {
    super(`order ${id} not found`);
    this.name = "OrderNotFoundError";
  }
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
    if (res.status === 404) throw new OrderNotFoundError(-1);
    if (!res.ok) throw new Error(`orders GET ${path} → ${res.status}`);
    return (await res.json()) as T;
  } finally {
    clearTimeout(timer);
  }
}

export function listOrders(
  params: { status?: string; page?: number; size?: number } = {},
): Promise<PageResponse<OrderSummary>> {
  const qs = new URLSearchParams();
  if (params.status) qs.set("status", params.status);
  if (params.page != null) qs.set("page", String(params.page));
  if (params.size != null) qs.set("size", String(params.size));
  const q = qs.toString();
  return getJSON<PageResponse<OrderSummary>>(`/admin/orders${q ? `?${q}` : ""}`);
}

export function fetchOrderStats(): Promise<OrderStats> {
  return getJSON<OrderStats>("/admin/orders/stats");
}

export function getOrder(id: number): Promise<Order> {
  return getJSON<Order>(`/orders/${id}`);
}
