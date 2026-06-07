"use client";

import { useEffect } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { Check } from "lucide-react";
import { Badge, buttonVariants } from "@gg/ui";
import { useOrderHydrated, useOrderStore } from "@/lib/order/order-store";
import { formatPrice } from "@/lib/mock-data";

function formatDate(d: Date): string {
  return d.toLocaleDateString("en-US", {
    month: "short",
    day: "numeric",
    year: "numeric",
  });
}

export function OrderConfirmation() {
  const router = useRouter();
  const hydrated = useOrderHydrated();
  const order = useOrderStore((s) => s.lastOrder);

  // Reached without placing an order (e.g. direct visit / refresh after close).
  useEffect(() => {
    if (hydrated && !order) router.replace("/");
  }, [hydrated, order, router]);

  if (!hydrated || !order) return null;

  const placed = new Date(order.placedAt);
  const etaStart = new Date(placed);
  etaStart.setDate(etaStart.getDate() + 3);
  const etaEnd = new Date(placed);
  etaEnd.setDate(etaEnd.getDate() + 5);

  return (
    <div className="mx-auto max-w-[520px] animate-[fadeInUp_500ms_both] py-16 text-center">
      <div
        className="clip-cyber mx-auto mb-7 flex size-20 items-center justify-center border border-success bg-success-muted"
        style={{ boxShadow: "0 0 30px rgba(22,199,122,0.25)" }}
      >
        <Check size={30} className="text-success" strokeWidth={2.5} />
      </div>

      <h1 className="font-[family-name:var(--font-display)] text-[28px] font-black uppercase tracking-[0.02em] text-fg-1 sm:text-[32px]">
        Order Confirmed
      </h1>
      <p className="mx-auto mt-2.5 max-w-[42ch] font-[family-name:var(--font-body)] text-[14px] leading-[1.6] text-fg-2">
        Thanks! Your order has been placed. We&apos;ll send a confirmation to{" "}
        <span className="text-fg-1">{order.email}</span> shortly.
      </p>

      <div className="clip-cyber mt-7 border border-border bg-surface px-7 py-5 text-left">
        {[
          {
            k: "Order Number",
            v: (
              <span className="font-[family-name:var(--font-mono)] font-semibold text-primary">
                {order.number}
              </span>
            ),
          },
          { k: "Items", v: `${order.itemCount}` },
          { k: "Total", v: formatPrice(order.totalCents) },
          {
            k: "Estimated Delivery",
            v: `${formatDate(etaStart)} – ${formatDate(etaEnd)}`,
          },
        ].map((row) => (
          <div
            key={row.k}
            className="flex items-center justify-between border-b border-border py-2.5 last:border-b-0"
          >
            <span className="font-[family-name:var(--font-body)] text-[12px] uppercase tracking-[0.06em] text-fg-3">
              {row.k}
            </span>
            <span className="font-[family-name:var(--font-body)] text-[13px] text-fg-1">
              {row.v}
            </span>
          </div>
        ))}
        <div className="flex items-center justify-between border-t border-border py-2.5 pt-3">
          <span className="font-[family-name:var(--font-body)] text-[12px] uppercase tracking-[0.06em] text-fg-3">
            Status
          </span>
          <Badge variant="confirmed" />
        </div>
      </div>

      <div className="mt-7 flex justify-center gap-3">
        <Link href="/" className={buttonVariants()}>
          Continue Shopping
        </Link>
      </div>
    </div>
  );
}
