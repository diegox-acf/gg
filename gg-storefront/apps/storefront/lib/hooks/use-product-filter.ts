"use client";

import { useMemo, useState } from "react";
import type { MockProduct } from "@/lib/mock-data";

export type SortKey = "featured" | "price-asc" | "price-desc";

export const SORT_OPTIONS: { value: SortKey; label: string }[] = [
  { value: "featured", label: "Featured" },
  { value: "price-asc", label: "Price: Low to High" },
  { value: "price-desc", label: "Price: High to Low" },
];

/**
 * Custom Hook pattern — encapsulates listing filter/sort state so any
 * product grid (category page, search results) can reuse it.
 */
export function useProductFilter(products: MockProduct[]) {
  const [inStockOnly, setInStockOnly] = useState(false);
  const [sort, setSort] = useState<SortKey>("featured");

  const filtered = useMemo(() => {
    let list = products;

    if (inStockOnly) {
      list = list.filter((p) => p.stockStatus !== "out-of-stock");
    }

    if (sort === "price-asc") {
      list = [...list].sort((a, b) => a.priceCents - b.priceCents);
    } else if (sort === "price-desc") {
      list = [...list].sort((a, b) => b.priceCents - a.priceCents);
    }

    return list;
  }, [products, inStockOnly, sort]);

  return { filtered, inStockOnly, setInStockOnly, sort, setSort };
}
