import Link from "next/link";
import { notFound } from "next/navigation";
import type { Metadata } from "next";
import { ChevronRight } from "lucide-react";
import { Nav } from "@/components/nav/nav";
import { CategoryProducts } from "@/components/category/category-products";
import { getCategoryBySlug, getProducts } from "@/lib/catalog/data";

// Per-request rendering against live Catalog data.
export const dynamic = "force-dynamic";

export async function generateMetadata({
  params,
}: {
  params: Promise<{ slug: string }>;
}): Promise<Metadata> {
  const { slug } = await params;
  const category = await getCategoryBySlug(slug);
  if (!category) return { title: "Category not found — GG Gaming" };
  return {
    title: `${category.name} — GG Gaming`,
    description: category.description,
  };
}

export default async function CategoryPage({
  params,
}: {
  params: Promise<{ slug: string }>;
}) {
  const { slug } = await params;

  // Container: owns data fetching; presenter (CategoryProducts) owns view state.
  const category = await getCategoryBySlug(slug);
  if (!category) notFound();

  const products = await getProducts({ categorySlug: category.slug });

  return (
    <>
      <Nav />

      <main className="mx-auto max-w-[1440px] px-4 py-10 sm:px-8 lg:px-12">
        {/* Breadcrumb */}
        <nav
          aria-label="Breadcrumb"
          className="mb-6 flex items-center gap-1.5 font-body text-[11px] uppercase tracking-[0.08em] text-fg-3"
        >
          <Link href="/" className="transition-colors hover:text-fg-1">
            Home
          </Link>
          <ChevronRight size={12} aria-hidden="true" />
          <span className="text-fg-1">{category.name}</span>
        </nav>

        {/* Header */}
        <header className="mb-10">
          <h1 className="font-display text-[28px] font-black uppercase tracking-[-0.01em] text-fg-1 sm:text-[34px]">
            {category.name}
          </h1>
          <p className="mt-2 max-w-[60ch] font-body text-[13px] leading-[1.6] text-fg-2">
            {category.description}
          </p>
        </header>

        <CategoryProducts products={products} />
      </main>
    </>
  );
}
