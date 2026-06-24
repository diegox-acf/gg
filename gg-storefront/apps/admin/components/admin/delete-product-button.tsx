"use client";

import { useState, useTransition } from "react";
import { Trash2 } from "lucide-react";
import { deleteProductAction } from "@/lib/actions/products";

// Inline confirm-then-delete. On success the server action's revalidatePath re-renders
// the list without the row.
export function DeleteProductButton({ productId }: { productId: number }) {
  const [confirming, setConfirming] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [pending, startTransition] = useTransition();

  function remove() {
    setError(null);
    startTransition(async () => {
      const res = await deleteProductAction(productId);
      if (!res.ok) {
        setError(res.error ?? "Failed");
        setConfirming(false);
      }
    });
  }

  if (error) {
    return <span className="font-body text-[11px] text-danger">{error}</span>;
  }

  if (confirming) {
    return (
      <span className="inline-flex items-center gap-2 font-body text-[11px]">
        <span className="text-fg-3">Delete?</span>
        <button
          type="button"
          onClick={remove}
          disabled={pending}
          className="font-semibold text-danger hover:underline disabled:opacity-50"
        >
          {pending ? "…" : "Yes"}
        </button>
        <button
          type="button"
          onClick={() => setConfirming(false)}
          className="text-fg-3 hover:text-fg-1"
        >
          No
        </button>
      </span>
    );
  }

  return (
    <button
      type="button"
      onClick={() => setConfirming(true)}
      aria-label="Delete product"
      className="text-fg-3 transition-colors hover:text-danger"
    >
      <Trash2 className="size-4" />
    </button>
  );
}
