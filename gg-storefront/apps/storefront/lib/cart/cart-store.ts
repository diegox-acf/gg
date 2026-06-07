"use client";

import { useEffect, useState } from "react";
import { create } from "zustand";
import { persist } from "zustand/middleware";
import type { MockProduct } from "@/lib/mock-data";

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

interface CartState {
  items: CartItem[];
  add: (product: MockProduct, qty?: number) => void;
  remove: (id: string) => void;
  setQty: (id: string, qty: number) => void;
  clear: () => void;
}

export const useCartStore = create<CartState>()(
  persist(
    (set) => ({
      items: [],

      add: (product, qty = 1) =>
        set((state) => {
          const existing = state.items.find((i) => i.id === product.id);
          if (existing) {
            return {
              items: state.items.map((i) =>
                i.id === product.id
                  ? { ...i, qty: Math.min(MAX_QTY, i.qty + qty) }
                  : i,
              ),
            };
          }
          const item: CartItem = {
            id: product.id,
            slug: product.slug,
            name: product.name,
            brand: product.brand,
            sku: product.sku,
            priceCents: product.priceCents,
            qty: Math.min(MAX_QTY, Math.max(1, qty)),
          };
          return { items: [...state.items, item] };
        }),

      remove: (id) =>
        set((state) => ({ items: state.items.filter((i) => i.id !== id) })),

      setQty: (id, qty) =>
        set((state) => ({
          items:
            qty <= 0
              ? state.items.filter((i) => i.id !== id)
              : state.items.map((i) =>
                  i.id === id ? { ...i, qty: Math.min(MAX_QTY, qty) } : i,
                ),
        })),

      clear: () => set({ items: [] }),
    }),
    { name: "gg-cart" },
  ),
);

/* Selector-subscription hooks — subscribe to derived primitives, not the whole store. */
export const useCartItems = () => useCartStore((s) => s.items);
export const useCartCount = () =>
  useCartStore((s) => s.items.reduce((n, i) => n + i.qty, 0));
export const useCartSubtotal = () =>
  useCartStore((s) => s.items.reduce((n, i) => n + i.priceCents * i.qty, 0));

/**
 * True only after the client has mounted. Persisted cart state rehydrates from
 * localStorage on the client, so any cart-derived UI that renders on the server
 * (e.g. the nav badge) must gate on this to avoid a hydration mismatch.
 */
export function useCartHydrated() {
  const [hydrated, setHydrated] = useState(false);
  useEffect(() => setHydrated(true), []);
  return hydrated;
}
