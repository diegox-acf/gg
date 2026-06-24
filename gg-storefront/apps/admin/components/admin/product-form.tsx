"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { Button, Input } from "@gg/ui";
import {
  createProductAction,
  updateProductAction,
  type ProductFormInput,
} from "@/lib/actions/products";
import type { CatalogCategory, CatalogStockStatus } from "@/lib/catalog/client";

const STOCK_STATUSES: CatalogStockStatus[] = ["in-stock", "low-stock", "out-of-stock"];

const labelCls =
  "mb-[6px] block font-display text-[9px] font-semibold uppercase tracking-[0.12em] text-fg-3";
const controlCls =
  "w-full border border-border bg-elevated px-[14px] py-[10px] font-body text-[13px] text-fg-1 outline-none transition-colors focus:border-primary clip-cyber-input";

export function ProductForm({
  mode,
  productId,
  categories,
  initial,
}: {
  mode: "create" | "edit";
  productId?: number;
  categories: CatalogCategory[];
  initial?: Partial<ProductFormInput>;
}) {
  const router = useRouter();
  const [pending, startTransition] = useTransition();
  const [error, setError] = useState<string | null>(null);
  const [f, setF] = useState<ProductFormInput>({
    sku: initial?.sku ?? "",
    slug: initial?.slug ?? "",
    name: initial?.name ?? "",
    brand: initial?.brand ?? "",
    description: initial?.description ?? "",
    categoryId: initial?.categoryId ?? categories[0]?.id ?? "",
    priceDollars: initial?.priceDollars ?? "",
    currency: initial?.currency ?? "USD",
    specsJson: initial?.specsJson ?? "{}",
    stockStatus: initial?.stockStatus ?? "in-stock",
  });

  const set = (k: keyof ProductFormInput, v: string) =>
    setF((s) => ({ ...s, [k]: v }));

  function submit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    startTransition(async () => {
      const res =
        mode === "create"
          ? await createProductAction(f)
          : await updateProductAction(productId!, f);
      if (!res.ok) {
        setError(res.error ?? "Failed");
        return;
      }
      router.push("/products");
      router.refresh();
    });
  }

  return (
    <form onSubmit={submit} className="max-w-[720px]" noValidate>
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
        <Input label="Name" value={f.name} onChange={(e) => set("name", e.target.value)} required />
        <Input label="Brand" value={f.brand} onChange={(e) => set("brand", e.target.value)} required />
        <Input label="SKU" value={f.sku} onChange={(e) => set("sku", e.target.value)} required />
        <Input label="Slug" value={f.slug} onChange={(e) => set("slug", e.target.value)} required />
        <Input
          label="Price (USD)"
          type="number"
          min="0"
          step="0.01"
          value={f.priceDollars}
          onChange={(e) => set("priceDollars", e.target.value)}
          required
        />
        <Input
          label="Currency"
          value={f.currency}
          onChange={(e) => set("currency", e.target.value)}
        />

        <div className="flex flex-col">
          <label htmlFor="category" className={labelCls}>
            Category
          </label>
          <select
            id="category"
            value={f.categoryId}
            onChange={(e) => set("categoryId", e.target.value)}
            className={controlCls}
          >
            {categories.map((c) => (
              <option key={c.id} value={c.id}>
                {c.label}
              </option>
            ))}
          </select>
        </div>

        <div className="flex flex-col">
          <label htmlFor="stock" className={labelCls}>
            Stock status
          </label>
          <select
            id="stock"
            value={f.stockStatus}
            onChange={(e) => set("stockStatus", e.target.value)}
            className={controlCls}
          >
            {STOCK_STATUSES.map((s) => (
              <option key={s} value={s}>
                {s}
              </option>
            ))}
          </select>
        </div>
      </div>

      <div className="mt-4 flex flex-col">
        <label htmlFor="description" className={labelCls}>
          Description
        </label>
        <textarea
          id="description"
          rows={3}
          value={f.description}
          onChange={(e) => set("description", e.target.value)}
          className={controlCls}
        />
      </div>

      <div className="mt-4 flex flex-col">
        <label htmlFor="specs" className={labelCls}>
          Specs (JSON)
        </label>
        <textarea
          id="specs"
          rows={4}
          value={f.specsJson}
          onChange={(e) => set("specsJson", e.target.value)}
          className={`${controlCls} font-mono text-[12px]`}
          spellCheck={false}
        />
      </div>

      {error && (
        <p
          role="alert"
          className="mt-4 border border-danger bg-danger/10 px-3 py-2 font-body text-[12px] text-danger"
        >
          {error}
        </p>
      )}

      <div className="mt-6 flex items-center gap-3">
        <Button type="submit" loading={pending}>
          {mode === "create" ? "Create product" : "Save changes"}
        </Button>
        <button
          type="button"
          onClick={() => router.push("/products")}
          className="font-body text-[12px] text-fg-3 hover:text-fg-1"
        >
          Cancel
        </button>
      </div>
    </form>
  );
}
