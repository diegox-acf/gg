"use server";

import { revalidatePath } from "next/cache";
import {
  createProduct,
  updateProduct,
  deleteProduct,
  CatalogWriteError,
  type ProductWrite,
  type CatalogStockStatus,
} from "@/lib/catalog/client";

// Raw form fields (strings) collected by the product form. Converted + validated here
// server-side before hitting Catalog. Pages are role-gated by the (admin) layout and
// the backend re-checks the admin role via X-User-Roles (ADR-022).
export interface ProductFormInput {
  sku: string;
  slug: string;
  name: string;
  brand: string;
  description: string;
  categoryId: string;
  priceDollars: string;
  currency: string;
  specsJson: string;
  stockStatus: string;
}

export interface ProductFormResult {
  ok: boolean;
  error?: string;
}

function toWrite(input: ProductFormInput): ProductWrite | { error: string } {
  const dollars = Number(input.priceDollars);
  if (!Number.isFinite(dollars) || dollars < 0) {
    return { error: "Enter a valid price (0 or more)." };
  }
  let specs: unknown = {};
  const raw = input.specsJson.trim();
  if (raw) {
    try {
      specs = JSON.parse(raw);
    } catch {
      return { error: "Specs must be valid JSON." };
    }
  }
  return {
    sku: input.sku.trim(),
    slug: input.slug.trim(),
    name: input.name.trim(),
    brand: input.brand.trim(),
    description: input.description,
    category_id: input.categoryId,
    price_cents: Math.round(dollars * 100),
    currency: input.currency.trim() || "USD",
    specs,
    stock_status: input.stockStatus as CatalogStockStatus,
  };
}

function errorMessage(e: unknown): string {
  if (e instanceof CatalogWriteError) return e.message;
  return "Request failed — the Catalog service may be unreachable.";
}

export async function createProductAction(input: ProductFormInput): Promise<ProductFormResult> {
  const write = toWrite(input);
  if ("error" in write) return { ok: false, error: write.error };
  try {
    await createProduct(write);
  } catch (e) {
    return { ok: false, error: errorMessage(e) };
  }
  revalidatePath("/products");
  revalidatePath("/");
  return { ok: true };
}

export async function updateProductAction(
  id: number,
  input: ProductFormInput,
): Promise<ProductFormResult> {
  const write = toWrite(input);
  if ("error" in write) return { ok: false, error: write.error };
  try {
    await updateProduct(id, write);
  } catch (e) {
    return { ok: false, error: errorMessage(e) };
  }
  revalidatePath("/products");
  revalidatePath(`/products/${id}/edit`);
  revalidatePath("/");
  return { ok: true };
}

export async function deleteProductAction(id: number): Promise<ProductFormResult> {
  try {
    await deleteProduct(id);
  } catch (e) {
    return { ok: false, error: errorMessage(e) };
  }
  revalidatePath("/products");
  revalidatePath("/");
  return { ok: true };
}
