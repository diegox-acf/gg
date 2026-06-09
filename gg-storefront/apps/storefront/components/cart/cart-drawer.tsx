"use client";

import { useEffect } from "react";
import Link from "next/link";
import { Minus, Plus, ShoppingCart, Trash2, X } from "lucide-react";
import { cn } from "@gg/ui";
import { MAX_QTY } from "@/lib/cart/types";
import { useCart } from "@/components/cart/cart-provider";
import { useUIStore } from "@/lib/ui/ui-store";
import { formatPrice } from "@/lib/mock-data";

export function CartDrawer() {
  const open = useUIStore((s) => s.cartOpen);
  const closeCart = useUIStore((s) => s.closeCart);
  const { items, subtotal, setQty, removeItem, clearCart } = useCart();

  // Close on Escape + lock body scroll while open.
  useEffect(() => {
    if (!open) return;
    function onKey(e: KeyboardEvent) {
      if (e.key === "Escape") closeCart();
    }
    document.addEventListener("keydown", onKey);
    const prev = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    return () => {
      document.removeEventListener("keydown", onKey);
      document.body.style.overflow = prev;
    };
  }, [open, closeCart]);

  if (!open) return null;

  const count = items.reduce((n, i) => n + i.qty, 0);

  return (
    <div className="fixed inset-0 z-[200]">
      {/* Backdrop */}
      <button
        aria-label="Close cart"
        onClick={closeCart}
        className="absolute inset-0 animate-[fadeIn_180ms_ease] bg-[var(--color-overlay)] backdrop-blur-[3px]"
      />

      {/* Panel */}
      <aside
        role="dialog"
        aria-label="Shopping cart"
        className="absolute right-0 top-0 flex h-full w-full animate-[slideInRight_240ms_cubic-bezier(0.16,1,0.3,1)] flex-col border-l border-border bg-surface shadow-[var(--shadow-card)] sm:w-[420px]"
      >
        {/* Header */}
        <header className="flex items-center justify-between border-b border-border px-5 py-4">
          <div className="flex items-center gap-2.5">
            <ShoppingCart size={18} className="text-primary" />
            <h2 className="font-display text-[13px] font-bold uppercase tracking-[0.12em] text-fg-1">
              Your Cart
            </h2>
            <span className="font-mono text-[12px] text-fg-3">
              ({count})
            </span>
          </div>
          <button
            aria-label="Close cart"
            onClick={closeCart}
            className="flex items-center p-1.5 text-fg-2 transition-colors hover:text-primary"
          >
            <X size={18} />
          </button>
        </header>

        {items.length === 0 ? (
          /* Empty state with recovery CTA */
          <div className="flex flex-1 flex-col items-center justify-center gap-4 px-6 text-center">
            <ShoppingCart size={44} className="text-fg-3" />
            <div>
              <p className="font-display text-[14px] font-bold uppercase tracking-[0.08em] text-fg-1">
                Your cart is empty
              </p>
              <p className="mt-1 font-body text-[12px] text-fg-2">
                Add some gear to get started.
              </p>
            </div>
            <Link
              href="/"
              onClick={closeCart}
              className="clip-cyber-xs bg-primary px-4 py-[9px] font-display text-[10px] font-bold uppercase tracking-[0.1em] text-fg-inverse transition-colors duration-150 hover:bg-primary-hover"
            >
              Browse Products
            </Link>
          </div>
        ) : (
          <>
            {/* Items */}
            <ul className="flex-1 overflow-y-auto px-5 py-4">
              {items.map((item) => (
                <li
                  key={item.id}
                  className="flex gap-3 border-b border-border py-4 last:border-b-0"
                >
                  <div className="flex size-16 flex-shrink-0 items-center justify-center bg-elevated">
                    <span className="font-mono text-[8px] tracking-[0.06em] text-fg-3">
                      {item.sku}
                    </span>
                  </div>

                  <div className="flex flex-1 flex-col">
                    <Link
                      href={`/product/${item.slug}`}
                      onClick={closeCart}
                      className="font-body text-[13px] font-semibold leading-[1.3] text-fg-1 transition-colors hover:text-primary"
                    >
                      {item.name}
                    </Link>
                    <span className="mt-0.5 font-body text-[10px] uppercase tracking-[0.08em] text-fg-3">
                      {item.brand}
                    </span>

                    <div className="mt-2 flex items-center justify-between">
                      {/* Qty stepper */}
                      <div className="flex items-center border border-border">
                        <button
                          aria-label="Decrease quantity"
                          onClick={() => setQty(item.id, item.qty - 1)}
                          className="flex size-7 items-center justify-center text-fg-2 transition-colors hover:text-fg-1"
                        >
                          <Minus size={12} />
                        </button>
                        <span className="min-w-7 text-center font-mono text-[12px] text-fg-1">
                          {item.qty}
                        </span>
                        <button
                          aria-label="Increase quantity"
                          disabled={item.qty >= MAX_QTY}
                          onClick={() => setQty(item.id, item.qty + 1)}
                          className="flex size-7 items-center justify-center text-fg-2 transition-colors hover:text-fg-1 disabled:cursor-not-allowed disabled:opacity-40"
                        >
                          <Plus size={12} />
                        </button>
                      </div>

                      <span className="font-display text-[14px] font-black text-fg-1">
                        {formatPrice(item.priceCents * item.qty)}
                      </span>
                    </div>
                  </div>

                  <button
                    aria-label={`Remove ${item.name}`}
                    onClick={() => removeItem(item.id)}
                    className="flex h-fit items-center p-1 text-fg-3 transition-colors hover:text-danger"
                  >
                    <Trash2 size={15} />
                  </button>
                </li>
              ))}
            </ul>

            {/* Footer */}
            <footer className="border-t border-border px-5 py-4">
              <div className="mb-3 flex items-center justify-between">
                <span className="font-body text-[12px] uppercase tracking-[0.1em] text-fg-2">
                  Subtotal
                </span>
                <span className="font-display text-[20px] font-black text-fg-1">
                  {formatPrice(subtotal)}
                </span>
              </div>

              <Link
                href="/checkout"
                onClick={closeCart}
                className="clip-cyber-btn flex w-full items-center justify-center bg-primary py-[13px] font-display text-[12px] font-bold uppercase tracking-[0.12em] text-fg-inverse transition-colors duration-150 hover:bg-primary-hover"
              >
                Checkout
              </Link>

              <div className="mt-2 flex items-center justify-between">
                <button
                  onClick={() => clearCart()}
                  className="font-body text-[11px] uppercase tracking-[0.06em] text-fg-3 transition-colors hover:text-danger"
                >
                  Clear cart
                </button>
                <button
                  onClick={closeCart}
                  className={cn(
                    "font-body text-[11px] uppercase tracking-[0.06em]",
                    "text-fg-3 transition-colors hover:text-fg-1",
                  )}
                >
                  Continue shopping
                </button>
              </div>
            </footer>
          </>
        )}
      </aside>
    </div>
  );
}
