"use server";

import { randomUUID } from "node:crypto";
import { auth } from "@/auth";
import { getCart } from "@/lib/cart/cart-repo";
import {
  createOrder,
  getOrder,
  OrderRequestError,
  type OrderStatus,
} from "@/lib/orders/client";

// Server Actions own the checkout write path. The browser never talks to Orders
// directly — it goes through these actions so identity (session) and the cart
// (Redis) are resolved server-side and Orders stays an internal service.

type ShippingInput = {
  email: string;
  firstName: string;
  lastName: string;
  address1: string;
  address2: string;
  city: string;
  state: string;
  zip: string;
  country: string;
};

export type PlaceOrderResult =
  | {
      ok: true;
      orderId: number;
      orderNumber: string;
      clientSecret: string;
      totalCents: number;
      itemCount: number;
      email: string;
    }
  | { ok: false; error: string };

/**
 * Creates the order and begins the saga (reserve → create PaymentIntent). Returns the Stripe
 * client_secret for the browser to confirm the card with Elements (ADR-021). Called when the user
 * advances to the payment step — so an out-of-stock cart fails here, before any card entry.
 */
export async function placeOrder(shipping: ShippingInput): Promise<PlaceOrderResult> {
  const session = await auth();
  if (!session?.user?.id) {
    return { ok: false, error: "Please sign in to complete checkout." };
  }

  const items = await getCart();
  if (items.length === 0) {
    return { ok: false, error: "Your cart is empty." };
  }

  try {
    const { order, client_secret } = await createOrder(session.user.id, randomUUID(), {
      items: items.map((i) => ({ product_id: Number(i.id), quantity: i.qty })),
      shipping: {
        name: `${shipping.firstName} ${shipping.lastName}`.trim(),
        line1: shipping.address1,
        line2: shipping.address2 || undefined,
        city: shipping.city,
        state: shipping.state,
        postal_code: shipping.zip,
        country: shipping.country,
      },
    });

    // Reserve (or payment setup) failed → the order is FAILED with no client_secret.
    if (order.status === "FAILED" || !client_secret) {
      return {
        ok: false,
        error: "We couldn't reserve all of your items — they may be out of stock.",
      };
    }

    return {
      ok: true,
      orderId: order.id,
      orderNumber: order.order_number,
      clientSecret: client_secret,
      totalCents: order.total_cents,
      itemCount: items.reduce((n, i) => n + i.qty, 0),
      email: shipping.email,
    };
  } catch (e) {
    if (e instanceof OrderRequestError && e.status === 422) {
      return { ok: false, error: "There's a problem with your order details." };
    }
    return { ok: false, error: "Checkout is temporarily unavailable. Please try again." };
  }
}

/** Polls a single order's terminal status (for the confirmation page). Authorizes by owner. */
export async function getOrderStatus(
  orderId: number,
): Promise<{ status: OrderStatus; orderNumber: string; totalCents: number } | null> {
  const session = await auth();
  if (!session?.user?.id) return null;

  const order = await getOrder(orderId);
  if (order.user_id !== session.user.id) return null; // not the owner — don't leak

  return {
    status: order.status,
    orderNumber: order.order_number,
    totalCents: order.total_cents,
  };
}
