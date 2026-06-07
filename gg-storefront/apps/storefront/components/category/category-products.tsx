"use client";

import Link from "next/link";
import { PackageOpen } from "lucide-react";
import { cn } from "@gg/ui";
import { ProductCard } from "@/components/product-card";
import type { MockProduct } from "@/lib/mock-data";
import {
  SORT_OPTIONS,
  useProductFilter,
  type SortKey,
} from "@/lib/hooks/use-product-filter";

interface CategoryProductsProps {
  products: MockProduct[];
}

/**
 * Container/Presenter: the server page is the container (owns data);
 * this is the presenter (owns view state via the useProductFilter hook).
 */
export function CategoryProducts({ products }: CategoryProductsProps) {
  const { filtered, inStockOnly, setInStockOnly, sort, setSort } =
    useProductFilter(products);

  return (
    <div>
      {/* Toolbar */}
      <div className="mb-6 flex flex-col gap-3 border-b border-border pb-4 sm:flex-row sm:items-center sm:justify-between">
        <p className="font-[family-name:var(--font-mono)] text-[11px] uppercase tracking-[0.1em] text-fg-3">
          {filtered.length} {filtered.length === 1 ? "result" : "results"}
        </p>

        <div className="flex flex-wrap items-center gap-3">
          {/* In-stock toggle */}
          <button
            type="button"
            onClick={() => setInStockOnly((v) => !v)}
            aria-pressed={inStockOnly}
            className={cn(
              "clip-cyber-xs border px-3 py-[7px]",
              "font-[family-name:var(--font-body)] text-[11px] font-medium uppercase tracking-[0.06em]",
              "transition-all duration-150",
              inStockOnly
                ? "border-primary bg-primary-muted text-primary"
                : "border-border bg-surface text-fg-2 hover:border-border-strong hover:text-fg-1",
            )}
          >
            In stock only
          </button>

          {/* Sort */}
          <label className="flex items-center gap-2">
            <span className="font-[family-name:var(--font-body)] text-[11px] uppercase tracking-[0.06em] text-fg-3">
              Sort
            </span>
            <select
              value={sort}
              onChange={(e) => setSort(e.target.value as SortKey)}
              className="clip-cyber-xs border border-border bg-surface px-3 py-[7px] font-[family-name:var(--font-body)] text-[12px] text-fg-1 outline-none transition-colors duration-150 hover:border-border-strong focus:border-primary"
            >
              {SORT_OPTIONS.map((opt) => (
                <option key={opt.value} value={opt.value} className="bg-surface">
                  {opt.label}
                </option>
              ))}
            </select>
          </label>
        </div>
      </div>

      {/* Grid or empty state */}
      {filtered.length > 0 ? (
        <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-4">
          {filtered.map((product, i) => (
            <ProductCard key={product.id} product={product} priority={i < 4} />
          ))}
        </div>
      ) : (
        /* Empty state — always paired with a recovery CTA */
        <div className="flex flex-col items-center justify-center gap-4 border border-dashed border-border bg-surface/40 px-6 py-16 text-center">
          <PackageOpen size={40} className="text-fg-3" />
          <div>
            <p className="font-[family-name:var(--font-display)] text-[14px] font-bold uppercase tracking-[0.08em] text-fg-1">
              No products found
            </p>
            <p className="mt-1 font-[family-name:var(--font-body)] text-[12px] text-fg-2">
              {inStockOnly
                ? "Nothing in stock here right now."
                : "This category has no products yet."}
            </p>
          </div>
          {inStockOnly ? (
            <button
              type="button"
              onClick={() => setInStockOnly(false)}
              className="clip-cyber-xs bg-primary px-4 py-[9px] font-[family-name:var(--font-display)] text-[10px] font-bold uppercase tracking-[0.1em] text-fg-inverse transition-colors duration-150 hover:bg-primary-hover"
            >
              Clear filter
            </button>
          ) : (
            <Link
              href="/"
              className="clip-cyber-xs bg-primary px-4 py-[9px] font-[family-name:var(--font-display)] text-[10px] font-bold uppercase tracking-[0.1em] text-fg-inverse transition-colors duration-150 hover:bg-primary-hover"
            >
              Browse all products
            </Link>
          )}
        </div>
      )}
    </div>
  );
}
