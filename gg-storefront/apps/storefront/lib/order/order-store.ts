"use client";

import { useEffect, useState } from "react";
import { create } from "zustand";
import { createJSONStorage, persist } from "zustand/middleware";

export interface PlacedOrder {
  number: string;
  placedAt: string; // ISO timestamp
  itemCount: number;
  totalCents: number;
  email: string;
}

interface OrderState {
  lastOrder: PlacedOrder | null;
  setLastOrder: (order: PlacedOrder) => void;
  clearLastOrder: () => void;
}

/**
 * Holds the just-placed order for the confirmation page. Session-scoped (clears
 * on tab close) and survives a refresh of the confirmation page.
 */
export const useOrderStore = create<OrderState>()(
  persist(
    (set) => ({
      lastOrder: null,
      setLastOrder: (order) => set({ lastOrder: order }),
      clearLastOrder: () => set({ lastOrder: null }),
    }),
    {
      name: "gg-last-order",
      storage: createJSONStorage(() => sessionStorage),
    },
  ),
);

export function useOrderHydrated() {
  const [hydrated, setHydrated] = useState(false);
  useEffect(() => setHydrated(true), []);
  return hydrated;
}

export function generateOrderNumber(date = new Date()): string {
  const n = Math.floor(Math.random() * 100000)
    .toString()
    .padStart(5, "0");
  return `GG-${date.getFullYear()}-${n}`;
}
