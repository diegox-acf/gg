import "server-only";

// Server-side client for the gg-orders REST API. The BFF's write path for checkout —
// only import from Server Actions / Server Components. Outbound fetch is auto-instrumented
// by @vercel/otel, so the browser→BFF→Orders→Inventory hops join one trace (like the
// Catalog client). Identity is forwarded as X-User-Id (the BFF is the trusted edge that
// resolved the session); Orders treats it as authoritative (ADR-017).

const BASE_URL = process.env.ORDERS_API_URL ?? "http://localhost:8083";
const TIMEOUT_MS = 8000;

export interface OrderLineItem {
  product_id: number;
  sku: string;
  name: string;
  unit_price_cents: number;
  quantity: number;
  total_cents: number;
}

export type OrderStatus =
  | "PENDING"
  | "RESERVING"
  | "PAYING"
  | "CONFIRMED"
  | "FAILED";

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
  created_at: string;
}

export interface CreateOrderRequest {
  items: { product_id: number; quantity: number }[];
  shipping: {
    name: string;
    line1: string;
    line2?: string;
    city: string;
    state: string;
    postal_code: string;
    country: string;
  };
}

/** POST /orders response: the order (resting in PAYING) + the Stripe client_secret (ADR-021). */
export interface CreateOrderResponse {
  order: Order;
  client_secret: string | null;
}

/** Raised when Orders rejects the request body (422) — surfaced to the user as a checkout error. */
export class OrderRequestError extends Error {
  constructor(public readonly status: number, message: string) {
    super(message);
    this.name = "OrderRequestError";
  }
}

async function request<T>(path: string, init: RequestInit): Promise<T> {
  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), TIMEOUT_MS);
  try {
    const res = await fetch(`${BASE_URL}${path}`, {
      ...init,
      signal: controller.signal,
      cache: "no-store",
      headers: { Accept: "application/json", ...init.headers },
    });
    if (!res.ok) {
      throw new OrderRequestError(res.status, `orders ${init.method ?? "GET"} ${path} → ${res.status}`);
    }
    return (await res.json()) as T;
  } finally {
    clearTimeout(timer);
  }
}

export function createOrder(
  userId: string,
  idempotencyKey: string,
  body: CreateOrderRequest,
): Promise<CreateOrderResponse> {
  return request<CreateOrderResponse>("/orders", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      "X-User-Id": userId,
      "Idempotency-Key": idempotencyKey,
    },
    body: JSON.stringify(body),
  });
}

export function getOrder(id: number): Promise<Order> {
  return request<Order>(`/orders/${id}`, { method: "GET" });
}

export function listOrdersForUser(userId: string): Promise<Order[]> {
  return request<Order[]>(`/orders?user_id=${encodeURIComponent(userId)}`, {
    method: "GET",
  });
}
