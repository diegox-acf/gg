"use client";

import { useState, useTransition } from "react";
import { restockAction } from "@/lib/actions/inventory";

// Inline per-row restock: a quantity input + button that calls the server action and
// lets revalidatePath refresh the table. Optimistic-UI isn't worth it here — the row's
// authoritative `available` comes back from the server re-render.
export function RestockControl({ productId }: { productId: number }) {
  const [qty, setQty] = useState(10);
  const [error, setError] = useState<string | null>(null);
  const [pending, startTransition] = useTransition();

  function submit() {
    setError(null);
    startTransition(async () => {
      const res = await restockAction(productId, qty);
      if (!res.ok) setError(res.error ?? "Failed");
    });
  }

  return (
    <div className="flex items-center justify-end gap-2">
      <input
        type="number"
        min={1}
        value={qty}
        onChange={(e) => setQty(parseInt(e.target.value, 10) || 0)}
        aria-label={`Restock quantity for product ${productId}`}
        className="w-16 border border-border bg-elevated px-2 py-1 text-right font-mono text-[12px] text-fg-1 outline-none transition-colors focus:border-primary clip-cyber-input"
      />
      <button
        type="button"
        onClick={submit}
        disabled={pending}
        className="border border-border-strong px-3 py-1 font-display text-[10px] font-semibold uppercase tracking-[0.1em] text-fg-1 transition-colors hover:border-primary hover:text-primary disabled:opacity-50 clip-cyber-btn"
      >
        {pending ? "…" : "Restock"}
      </button>
      {error && <span className="font-body text-[11px] text-danger">{error}</span>}
    </div>
  );
}
