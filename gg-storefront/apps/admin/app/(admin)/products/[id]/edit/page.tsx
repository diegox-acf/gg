import Link from "next/link";
import { notFound } from "next/navigation";
import { ArrowLeft } from "lucide-react";
import { fetchProduct, fetchCategories } from "@/lib/catalog/client";
import { ProductForm } from "@/components/admin/product-form";

export default async function EditProductPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const productId = Number(id);
  if (!Number.isFinite(productId)) notFound();

  let product;
  let categories;
  try {
    [product, categories] = await Promise.all([
      fetchProduct(productId).then((r) => r.product),
      fetchCategories().then((r) => r.categories ?? []),
    ]);
  } catch {
    notFound();
  }

  const initial = {
    sku: product.sku,
    slug: product.slug,
    name: product.name,
    brand: product.brand,
    description: product.description,
    categoryId: product.category_id,
    priceDollars: (product.price_cents / 100).toString(),
    currency: product.currency,
    specsJson: JSON.stringify(product.specs ?? {}, null, 2),
    stockStatus: product.stock_status,
  };

  return (
    <div>
      <Link
        href="/products"
        className="inline-flex items-center gap-2 font-body text-[12px] text-fg-3 hover:text-fg-1"
      >
        <ArrowLeft className="size-4" /> Back to products
      </Link>
      <h1 className="mt-4 font-display text-[22px] font-extrabold uppercase tracking-[0.06em] text-fg-1">
        Edit product
      </h1>
      <p className="mt-1 font-mono text-[12px] text-fg-3">{product.sku}</p>

      <div className="mt-6">
        <ProductForm
          mode="edit"
          productId={productId}
          categories={categories}
          initial={initial}
        />
      </div>
    </div>
  );
}
