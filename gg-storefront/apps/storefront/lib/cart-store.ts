'use client'
import { create } from 'zustand'
import type { Product } from './mock-data'

export interface CartItem {
  product: Product
  qty: number
}

interface CartStore {
  items: CartItem[]
  isOpen: boolean
  open: () => void
  close: () => void
  add: (product: Product) => void
  update: (id: number, qty: number) => void
  remove: (id: number) => void
  clear: () => void
  totalCount: () => number
  subtotal: () => number
}

export const useCartStore = create<CartStore>((set, get) => ({
  items: [],
  isOpen: false,

  open:  () => set({ isOpen: true }),
  close: () => set({ isOpen: false }),

  add: (product) =>
    set((state) => {
      const existing = state.items.find((i) => i.product.id === product.id)
      if (existing) {
        return {
          items: state.items.map((i) =>
            i.product.id === product.id ? { ...i, qty: i.qty + 1 } : i,
          ),
        }
      }
      return { items: [...state.items, { product, qty: 1 }] }
    }),

  update: (id, qty) =>
    set((state) => ({
      items:
        qty <= 0
          ? state.items.filter((i) => i.product.id !== id)
          : state.items.map((i) => (i.product.id === id ? { ...i, qty } : i)),
    })),

  remove: (id) =>
    set((state) => ({ items: state.items.filter((i) => i.product.id !== id) })),

  clear: () => set({ items: [] }),

  totalCount: () => get().items.reduce((n, i) => n + i.qty, 0),

  subtotal: () =>
    get().items.reduce((sum, i) => sum + (i.product.price_cents / 100) * i.qty, 0),
}))
