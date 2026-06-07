"use server";

import { mutateCart } from "@/lib/cart/cart-repo";
import type { CartItem } from "@/lib/cart/types";

// Server Actions own the cart write path (no client-side persistence). Each
// returns the authoritative cart so the client can reconcile its optimistic state.

export async function addItemAction(
  item: Omit<CartItem, "qty">,
  qty = 1,
): Promise<CartItem[]> {
  return mutateCart({ type: "add", item, qty });
}

export async function setQtyAction(id: string, qty: number): Promise<CartItem[]> {
  return mutateCart({ type: "setQty", id, qty });
}

export async function removeItemAction(id: string): Promise<CartItem[]> {
  return mutateCart({ type: "remove", id });
}

export async function clearCartAction(): Promise<CartItem[]> {
  return mutateCart({ type: "clear" });
}
