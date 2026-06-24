"use server";

import { revalidatePath } from "next/cache";
import { restock } from "@/lib/inventory/admin-client";

export interface RestockResult {
  ok: boolean;
  available?: number;
  error?: string;
}

// Admin restock action. Pages are role-gated by the (admin) layout, and the backend
// re-checks the admin role via the forwarded X-User-Roles header (ADR-022).
export async function restockAction(
  productId: number,
  quantity: number,
): Promise<RestockResult> {
  if (!Number.isInteger(quantity) || quantity <= 0) {
    return { ok: false, error: "Enter a positive whole number." };
  }
  try {
    const stock = await restock(productId, quantity);
    revalidatePath("/inventory");
    revalidatePath("/");
    return { ok: true, available: stock.available };
  } catch {
    return { ok: false, error: "Restock failed." };
  }
}
