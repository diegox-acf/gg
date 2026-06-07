import type { MockProduct } from "@/lib/mock-data";
import type { CartItem } from "./types";

// Snapshot the fields the cart needs from a product. (Price is snapshotted from
// the view model, matching the prior behavior; a future hardening step could have
// the server re-resolve price from the catalog at add time.)
export function toCartItem(product: MockProduct): Omit<CartItem, "qty"> {
  return {
    id: product.id,
    slug: product.slug,
    name: product.name,
    brand: product.brand,
    sku: product.sku,
    priceCents: product.priceCents,
  };
}
