import Link from "next/link";
import { notFound } from "next/navigation";
import type { Metadata } from "next";
import { ChevronRight, Package } from "lucide-react";
import { Badge } from "@gg/ui";
import { Nav } from "@/components/nav/nav";
import { ProductCard } from "@/components/product-card";
import { ProductBuyPanel } from "@/components/product/product-buy-panel";
import { formatPrice } from "@/lib/mock-data";
import {
  getCategoryBySlug,
  getProductBySlug,
  getRelatedProducts,
} from "@/lib/catalog/data";

// Per-request rendering against live Catalog data.
export const dynamic = "force-dynamic";

export async function generateMetadata({
  params,
}: {
  params: Promise<{ slug: string }>;
}): Promise<Metadata> {
  const { slug } = await params;
  const product = await getProductBySlug(slug);
  if (!product) return { title: "Product not found — GG Gaming" };
  return {
    title: `${product.name} — GG Gaming`,
    description: product.description,
  };
}

export default async function ProductPage({
  params,
}: {
  params: Promise<{ slug: string }>;
}) {
  const { slug } = await params;

  // Container: resolves product data; presenters own interaction/view.
  const product = await getProductBySlug(slug);
  if (!product) notFound();

  const [category, related] = await Promise.all([
    getCategoryBySlug(product.categorySlug),
    getRelatedProducts(product),
  ]);

  const detailRows = [
    { label: "Brand", value: product.brand },
    { label: "SKU", value: product.sku, mono: true },
    { label: "Category", value: category?.name ?? product.categorySlug },
  ];

  const specRows = Object.entries(product.specs ?? {});

  return (
    <>
      <Nav />

      <main className="mx-auto max-w-[1440px] px-4 py-10 sm:px-8 lg:px-12">
        {/* Breadcrumb */}
        <nav
          aria-label="Breadcrumb"
          className="mb-8 flex flex-wrap items-center gap-1.5 font-[family-name:var(--font-body)] text-[11px] uppercase tracking-[0.08em] text-fg-3"
        >
          <Link href="/" className="transition-colors hover:text-fg-1">
            Home
          </Link>
          <ChevronRight size={12} aria-hidden="true" />
          {category && (
            <>
              <Link
                href={`/category/${category.slug}`}
                className="transition-colors hover:text-fg-1"
              >
                {category.name}
              </Link>
              <ChevronRight size={12} aria-hidden="true" />
            </>
          )}
          <span className="text-fg-1">{product.name}</span>
        </nav>

        {/* Product detail — image + info */}
        <div className="grid gap-8 lg:grid-cols-2 lg:gap-12">
          {/* Image panel */}
          <div className="clip-cyber relative flex aspect-square items-center justify-center overflow-hidden border border-border bg-elevated">
            <span className="absolute right-4 top-3 font-[family-name:var(--font-mono)] text-[10px] tracking-[0.08em] text-fg-3">
              {product.sku}
            </span>
            {/* HUD corners */}
            <span
              aria-hidden="true"
              className="absolute left-0 top-0 size-6 border-l-2 border-t-2 border-primary"
            />
            <span
              aria-hidden="true"
              className="absolute bottom-0 right-0 size-6 border-b-2 border-r-2 border-primary"
            />
            {/* Phase 1: replace with next/image from the Catalog image service */}
            <Package size={96} className="text-border-strong" />
          </div>

          {/* Info panel */}
          <div className="flex flex-col">
            <p className="mb-2 font-[family-name:var(--font-body)] text-[11px] font-semibold uppercase tracking-[0.14em] text-fg-3">
              {product.brand}
            </p>
            <h1 className="font-[family-name:var(--font-display)] text-[26px] font-black leading-[1.15] tracking-[-0.01em] text-fg-1 sm:text-[32px]">
              {product.name}
            </h1>

            <div className="mt-5 flex items-center gap-4">
              <span className="font-[family-name:var(--font-display)] text-[30px] font-black tracking-[-0.02em] text-fg-1">
                {formatPrice(product.priceCents)}
              </span>
              <Badge variant={product.stockStatus} />
            </div>

            <p className="mt-5 max-w-[55ch] font-[family-name:var(--font-body)] text-[14px] leading-[1.7] text-fg-2">
              {product.description}
            </p>

            <div className="my-7 h-px bg-border" />

            <ProductBuyPanel product={product} />

            {/* Specifications — only rendered when the catalog carries specs */}
            {specRows.length > 0 && (
              <section className="mt-8">
                <h2 className="mb-3 font-[family-name:var(--font-display)] text-[9px] font-semibold uppercase tracking-[0.18em] text-fg-3">
                  Specifications
                </h2>
                <dl className="flex flex-col gap-px overflow-hidden border border-border bg-border">
                  {specRows.map(([label, value]) => (
                    <div
                      key={label}
                      className="flex items-center justify-between gap-4 bg-surface px-4 py-3"
                    >
                      <dt className="font-[family-name:var(--font-body)] text-[11px] uppercase tracking-[0.1em] text-fg-3">
                        {label}
                      </dt>
                      <dd className="text-right font-[family-name:var(--font-mono)] text-[13px] text-fg-1">
                        {value}
                      </dd>
                    </div>
                  ))}
                </dl>
              </section>
            )}

            {/* Detail rows */}
            <dl className="mt-8 flex flex-col gap-px overflow-hidden border border-border bg-border">
              {detailRows.map((row) => (
                <div
                  key={row.label}
                  className="flex items-center justify-between bg-surface px-4 py-3"
                >
                  <dt className="font-[family-name:var(--font-body)] text-[11px] uppercase tracking-[0.1em] text-fg-3">
                    {row.label}
                  </dt>
                  <dd
                    className={
                      row.mono
                        ? "font-[family-name:var(--font-mono)] text-[13px] text-fg-1"
                        : "font-[family-name:var(--font-body)] text-[13px] font-medium text-fg-1"
                    }
                  >
                    {row.value}
                  </dd>
                </div>
              ))}
            </dl>
          </div>
        </div>

        {/* Related products */}
        {related.length > 0 && (
          <section className="mt-20">
            <h2 className="mb-6 font-[family-name:var(--font-display)] text-[9px] font-semibold uppercase tracking-[0.18em] text-fg-3">
              More in {category?.name ?? "this category"}
            </h2>
            <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-4">
              {related.map((p) => (
                <ProductCard key={p.id} product={p} />
              ))}
            </div>
          </section>
        )}
      </main>
    </>
  );
}
