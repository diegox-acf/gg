// Shared cart domain types + pure helpers. No "use client"/"server-only" — this
// is imported by both the client provider (for optimistic updates) and the
// server-side Redis repo, so the add/setQty/remove logic stays identical on both.

export const MAX_QTY = 10;

export interface CartItem {
  id: string;
  slug: string;
  name: string;
  brand: string;
  sku: string;
  priceCents: number;
  qty: number;
}

export type CartMutation =
  | { type: "add"; item: Omit<CartItem, "qty">; qty: number }
  | { type: "setQty"; id: string; qty: number }
  | { type: "remove"; id: string }
  | { type: "clear" };

/** Pure reducer — the single source of cart mutation semantics. */
export function applyCartMutation(
  items: CartItem[],
  m: CartMutation,
): CartItem[] {
  switch (m.type) {
    case "add": {
      const qty = Math.min(MAX_QTY, Math.max(1, m.qty));
      const existing = items.find((i) => i.id === m.item.id);
      if (existing) {
        return items.map((i) =>
          i.id === m.item.id
            ? { ...i, qty: Math.min(MAX_QTY, i.qty + qty) }
            : i,
        );
      }
      return [...items, { ...m.item, qty }];
    }
    case "setQty": {
      if (m.qty <= 0) return items.filter((i) => i.id !== m.id);
      return items.map((i) =>
        i.id === m.id ? { ...i, qty: Math.min(MAX_QTY, m.qty) } : i,
      );
    }
    case "remove":
      return items.filter((i) => i.id !== m.id);
    case "clear":
      return [];
  }
}

/** Merge two carts (used on login): sum quantities, capped at MAX_QTY. */
export function mergeCarts(base: CartItem[], incoming: CartItem[]): CartItem[] {
  let result = base;
  for (const item of incoming) {
    const { qty, ...rest } = item;
    result = applyCartMutation(result, { type: "add", item: rest, qty });
  }
  return result;
}

export const cartCount = (items: CartItem[]): number =>
  items.reduce((n, i) => n + i.qty, 0);

export const cartSubtotal = (items: CartItem[]): number =>
  items.reduce((n, i) => n + i.priceCents * i.qty, 0);
