"use client";

import {
  createContext,
  useCallback,
  useContext,
  useOptimistic,
  useState,
  useTransition,
} from "react";
import {
  applyCartMutation,
  cartCount,
  cartSubtotal,
  type CartItem,
  type CartMutation,
} from "@/lib/cart/types";
import {
  addItemAction,
  clearCartAction,
  removeItemAction,
  setQtyAction,
} from "@/lib/actions/cart";

interface CartContextValue {
  items: CartItem[];
  count: number;
  subtotal: number;
  pending: boolean;
  addItem: (item: Omit<CartItem, "qty">, qty?: number) => Promise<void>;
  setQty: (id: string, qty: number) => Promise<void>;
  removeItem: (id: string) => Promise<void>;
  clearCart: () => Promise<void>;
}

const CartContext = createContext<CartContextValue | null>(null);

/**
 * The cart's source of truth is Redis (Server Actions own all writes). This
 * provider holds only a client *mirror*: seeded from the server on load, updated
 * to the authoritative result each action returns, and shown optimistically in
 * between via useOptimistic. No client-side persistence (no localStorage).
 */
export function CartProvider({
  initialItems,
  children,
}: {
  initialItems: CartItem[];
  children: React.ReactNode;
}) {
  const [items, setItems] = useState<CartItem[]>(initialItems);
  const [optimisticItems, applyOptimistic] = useOptimistic(
    items,
    (state, m: CartMutation) => applyCartMutation(state, m),
  );
  const [pending, startTransition] = useTransition();

  const run = useCallback(
    (m: CartMutation, action: () => Promise<CartItem[]>) =>
      new Promise<void>((resolve) => {
        startTransition(async () => {
          applyOptimistic(m);
          try {
            setItems(await action());
          } finally {
            resolve();
          }
        });
      }),
    [applyOptimistic],
  );

  const addItem = useCallback(
    (item: Omit<CartItem, "qty">, qty = 1) =>
      run({ type: "add", item, qty }, () => addItemAction(item, qty)),
    [run],
  );
  const setQty = useCallback(
    (id: string, qty: number) =>
      run({ type: "setQty", id, qty }, () => setQtyAction(id, qty)),
    [run],
  );
  const removeItem = useCallback(
    (id: string) => run({ type: "remove", id }, () => removeItemAction(id)),
    [run],
  );
  const clearCart = useCallback(
    () => run({ type: "clear" }, () => clearCartAction()),
    [run],
  );

  return (
    <CartContext.Provider
      value={{
        items: optimisticItems,
        count: cartCount(optimisticItems),
        subtotal: cartSubtotal(optimisticItems),
        pending,
        addItem,
        setQty,
        removeItem,
        clearCart,
      }}
    >
      {children}
    </CartContext.Provider>
  );
}

/* Custom-hook pattern: cart access for any client component under the provider. */
export function useCart(): CartContextValue {
  const ctx = useContext(CartContext);
  if (!ctx) throw new Error("useCart must be used within <CartProvider>");
  return ctx;
}
