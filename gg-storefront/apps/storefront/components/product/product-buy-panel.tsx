"use client";

import { useState } from "react";
import { Check, Minus, Plus } from "lucide-react";
import { cn } from "@gg/ui";
import type { MockProduct } from "@/lib/mock-data";
import { MAX_QTY } from "@/lib/cart/types";
import { useCart } from "@/components/cart/cart-provider";
import { toCartItem } from "@/lib/cart/to-cart-item";
import { useUIStore } from "@/lib/ui/ui-store";

interface ProductBuyPanelProps {
  product: MockProduct;
}

/**
 * Container/Presenter: the server page owns product data; this presenter owns
 * the local buy interaction (quantity + add-to-cart), committing via the cart
 * provider (optimistic mirror + Server Action → Redis).
 */
export function ProductBuyPanel({ product }: ProductBuyPanelProps) {
  const [qty, setQty] = useState(1);
  const [added, setAdded] = useState(false);
  const { addItem } = useCart();
  const openCart = useUIStore((s) => s.openCart);
  const isOOS = product.stockStatus === "out-of-stock";

  function handleAdd() {
    if (isOOS) return;
    // Optimistic UI: commit to the cart immediately, then surface confirmation.
    addItem(toCartItem(product), qty);
    openCart();
    setAdded(true);
    window.setTimeout(() => setAdded(false), 1800);
  }

  return (
    <div className="flex flex-col gap-4">
      {/* Quantity stepper */}
      <div className="flex items-center gap-3">
        <span className="font-[family-name:var(--font-body)] text-[11px] uppercase tracking-[0.1em] text-fg-3">
          Qty
        </span>
        <div className="clip-cyber-xs flex items-center border border-border bg-surface">
          <button
            type="button"
            aria-label="Decrease quantity"
            disabled={isOOS || qty <= 1}
            onClick={() => setQty((q) => Math.max(1, q - 1))}
            className="flex size-9 items-center justify-center text-fg-2 transition-colors duration-150 hover:text-fg-1 disabled:cursor-not-allowed disabled:opacity-40"
          >
            <Minus size={14} />
          </button>
          <span
            aria-live="polite"
            className="min-w-9 text-center font-[family-name:var(--font-mono)] text-[14px] font-medium text-fg-1"
          >
            {qty}
          </span>
          <button
            type="button"
            aria-label="Increase quantity"
            disabled={isOOS || qty >= MAX_QTY}
            onClick={() => setQty((q) => Math.min(MAX_QTY, q + 1))}
            className="flex size-9 items-center justify-center text-fg-2 transition-colors duration-150 hover:text-fg-1 disabled:cursor-not-allowed disabled:opacity-40"
          >
            <Plus size={14} />
          </button>
        </div>
      </div>

      {/* Add to cart */}
      <button
        type="button"
        disabled={isOOS}
        onClick={handleAdd}
        className={cn(
          "clip-cyber-btn flex items-center justify-center gap-2 px-6 py-[14px]",
          "font-[family-name:var(--font-display)] text-[12px] font-bold uppercase tracking-[0.12em]",
          "border-none transition-all duration-150",
          isOOS
            ? "cursor-not-allowed bg-border text-fg-3"
            : added
              ? "cursor-default bg-success text-fg-inverse"
              : "cursor-pointer bg-primary text-fg-inverse hover:bg-primary-hover",
        )}
      >
        {isOOS ? (
          "Out of Stock"
        ) : added ? (
          <>
            <Check size={15} /> Added to Cart
          </>
        ) : (
          "Add to Cart"
        )}
      </button>
    </div>
  );
}
