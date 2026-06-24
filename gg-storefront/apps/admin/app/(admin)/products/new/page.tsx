import Link from "next/link";
import { ArrowLeft } from "lucide-react";
import { fetchCategories } from "@/lib/catalog/client";
import { ProductForm } from "@/components/admin/product-form";

export default async function NewProductPage() {
  let categories: Awaited<ReturnType<typeof fetchCategories>>["categories"] = null;
  let error = false;
  try {
    categories = (await fetchCategories()).categories;
  } catch {
    error = true;
  }

  return (
    <div>
      <Link
        href="/products"
        className="inline-flex items-center gap-2 font-body text-[12px] text-fg-3 hover:text-fg-1"
      >
        <ArrowLeft className="size-4" /> Back to products
      </Link>
      <h1 className="mt-4 font-display text-[22px] font-extrabold uppercase tracking-[0.06em] text-fg-1">
        New product
      </h1>

      {error || !categories ? (
        <p className="mt-6 border border-danger/40 bg-danger/10 px-4 py-3 font-body text-[13px] text-danger">
          Couldn&apos;t load categories — the Catalog service may be unreachable.
        </p>
      ) : (
        <div className="mt-6">
          <ProductForm mode="create" categories={categories} />
        </div>
      )}
    </div>
  );
}
