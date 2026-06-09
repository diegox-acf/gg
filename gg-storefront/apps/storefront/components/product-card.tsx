"use client";

import { useRef, useState } from "react";
import Link from "next/link";
import Image from "next/image";
import { Package } from "lucide-react";
import { cn } from "@gg/ui";
import { Badge } from "@gg/ui";
import type { MockProduct } from "@/lib/mock-data";
import { formatPrice } from "@/lib/mock-data";
import { useCart } from "@/components/cart/cart-provider";
import { toCartItem } from "@/lib/cart/to-cart-item";
import { useUIStore } from "@/lib/ui/ui-store";

interface ProductCardProps {
  product: MockProduct;
  priority?: boolean;
}

export function ProductCard({ product }: ProductCardProps) {
  const [hovered, setHovered] = useState(false);
  const scanRef = useRef<HTMLDivElement>(null);
  const { addItem } = useCart();
  const openCart = useUIStore((s) => s.openCart);
  const isOOS = product.stockStatus === "out-of-stock";

  function triggerScan() {
    const el = scanRef.current;
    if (!el || isOOS) return;
    el.style.animation = "none";
    el.offsetHeight; // force reflow to restart animation
    el.style.animation = "scanSweep 0.65s ease forwards";
  }

  return (
    /* Container/Presenter: this card is the presenter; data comes from server */
    <div
      onMouseEnter={() => {
        if (!isOOS) {
          setHovered(true);
          triggerScan();
        }
      }}
      onMouseLeave={() => setHovered(false)}
      className={cn(
        "clip-cyber overflow-hidden relative flex flex-col",
        "bg-surface border border-border",
        "transition-all duration-[200ms] ease-[cubic-bezier(0.16,1,0.3,1)]",
        isOOS ? "opacity-[0.55]" : "cursor-pointer",
        !isOOS && hovered && ["border-border-accent", "-translate-y-[3px]"],
      )}
      style={
        !isOOS && hovered
          ? { filter: "drop-shadow(0 8px 24px rgba(255,53,0,0.20))" }
          : undefined
      }
    >
      {/* Scan sweep — positioned inside the image area */}
      <div
        ref={scanRef}
        aria-hidden="true"
        className="pointer-events-none absolute left-0 right-0 z-10 h-[80px] bg-gradient-to-b from-transparent via-primary/7 to-transparent"
        style={{ top: -80 }}
      />

      {/* HUD corners */}
      <span
        aria-hidden="true"
        className={cn(
          "absolute left-0 top-0 border-l-[1.5px] border-t-[1.5px] border-primary z-20",
          "transition-all duration-[180ms]",
          hovered && !isOOS ? "opacity-100 size-4" : "opacity-0 size-[10px]",
        )}
      />
      <span
        aria-hidden="true"
        className={cn(
          "absolute bottom-0 right-0 border-r-[1.5px] border-b-[1.5px] border-primary z-20",
          "transition-all duration-[180ms]",
          hovered && !isOOS ? "opacity-100 size-4" : "opacity-0 size-[10px]",
        )}
      />

      {/* Stretched link — makes the whole card navigate to the detail page.
          The Add to Cart button sits above this via z-30 so it stays clickable. */}
      <Link
        href={`/product/${product.slug}`}
        aria-label={product.name}
        className="absolute inset-0 z-20"
      />

      {/* Image area */}
      <div className="relative flex h-[200px] items-center justify-center overflow-hidden bg-elevated">
        {product.imageUrl ? (
          <Image
            src={product.imageUrl}
            alt={product.name}
            fill
            sizes="(max-width: 640px) 50vw, 25vw"
            className="object-cover"
            // Catalog serves these on localhost; Next 16's optimizer blocks loopback
            // IPs (SSRF guard), so load them directly.
            unoptimized
          />
        ) : (
          <Package size={40} className="text-border-strong" />
        )}
      </div>

      {/* Card body */}
      <div className="flex flex-1 flex-col p-[12px]">
        <div className="mb-[3px] flex items-center justify-between gap-2">
          <p className="font-body text-[10px] font-semibold uppercase tracking-[0.1em] text-fg-3">
            {product.brand}
          </p>
          {/* SKU sits at the right edge of the brand row (right-0 via justify-between) */}
          <span className="font-mono text-[10px] tracking-[0.08em] text-fg-3">
            {product.sku}
          </span>
        </div>
        <p className="mb-[10px] min-h-[30px] font-body text-[12px] font-semibold leading-[1.3] text-fg-1">
          {product.name}
        </p>

        <div className="mb-[10px] flex items-center justify-between">
          <span className="font-display text-[16px] font-black tracking-[-0.02em] text-fg-1">
            {formatPrice(product.priceCents)}
          </span>
          <Badge variant={product.stockStatus} />
        </div>

        {/* CTA button — inlined since it's full-width with card-specific clip */}
        <button
          disabled={isOOS}
          onClick={(e) => {
            e.preventDefault();
            e.stopPropagation();
            if (isOOS) return;
            // Optimistic UI: provider updates the mirror immediately, server
            // action persists to Redis; reveal the drawer right away.
            addItem(toCartItem(product));
            openCart();
          }}
          className={cn(
            "relative z-30 w-full py-[9px]",
            "font-display text-[10px] font-bold uppercase tracking-[0.1em]",
            "clip-cyber-xs border-none transition-all duration-150",
            isOOS
              ? "cursor-not-allowed bg-border text-fg-3"
              : "cursor-pointer bg-primary text-fg-inverse hover:bg-primary-hover",
          )}
        >
          {isOOS ? "Out of Stock" : "Add to Cart"}
        </button>
      </div>
    </div>
  );
}
