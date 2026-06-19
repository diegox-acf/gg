"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { Check, Loader2, X } from "lucide-react";
import { Badge, buttonVariants } from "@gg/ui";
import { useOrderHydrated, useOrderStore } from "@/lib/order/order-store";
import { getOrderStatus } from "@/lib/actions/checkout";
import type { OrderStatus } from "@/lib/orders/client";
import { formatPrice } from "@/lib/mock-data";

function formatDate(d: Date): string {
  return d.toLocaleDateString("en-US", {
    month: "short",
    day: "numeric",
    year: "numeric",
  });
}

const POLL_INTERVAL_MS = 1500;
const MAX_POLLS = 20; // ~30s — covers webhook lag; after that we show "processing"

export function OrderConfirmation() {
  const router = useRouter();
  const hydrated = useOrderHydrated();
  const order = useOrderStore((s) => s.lastOrder);

  // Payment is async (ADR-020): the order is PAYING when we land here; poll until the webhook
  // drives it to CONFIRMED/FAILED.
  const [status, setStatus] = useState<OrderStatus>("PAYING");

  // Reached without placing an order (e.g. direct visit / refresh after close).
  useEffect(() => {
    if (hydrated && !order) router.replace("/");
  }, [hydrated, order, router]);

  useEffect(() => {
    if (!order) return;
    let polls = 0;
    let active = true;
    const tick = async () => {
      const res = await getOrderStatus(order.id);
      if (!active) return;
      if (res) setStatus(res.status);
      polls += 1;
      if (res && (res.status === "CONFIRMED" || res.status === "FAILED")) return; // terminal
      if (polls < MAX_POLLS) timer = setTimeout(tick, POLL_INTERVAL_MS);
    };
    let timer = setTimeout(tick, 0);
    return () => {
      active = false;
      clearTimeout(timer);
    };
  }, [order]);

  if (!hydrated || !order) return null;

  if (status === "FAILED") {
    return (
      <div className="mx-auto max-w-[520px] animate-[fadeInUp_500ms_both] py-16 text-center">
        <div className="clip-cyber mx-auto mb-7 flex size-20 items-center justify-center border border-danger bg-danger-muted">
          <X size={30} className="text-danger" strokeWidth={2.5} />
        </div>
        <h1 className="font-display text-[28px] font-black uppercase tracking-[0.02em] text-fg-1 sm:text-[32px]">
          Payment Failed
        </h1>
        <p className="mx-auto mt-2.5 max-w-[42ch] font-body text-[14px] leading-[1.6] text-fg-2">
          We couldn&apos;t complete payment for order{" "}
          <span className="font-mono text-fg-1">{order.number}</span>. You haven&apos;t
          been charged and any reserved stock has been released.
        </p>
        <div className="mt-7 flex justify-center gap-3">
          <Link href="/checkout" className={buttonVariants()}>
            Try Again
          </Link>
          <Link href="/" className={buttonVariants({ variant: "secondary" })}>
            Continue Shopping
          </Link>
        </div>
      </div>
    );
  }

  const confirmed = status === "CONFIRMED";
  const placed = new Date(order.placedAt);
  const etaStart = new Date(placed);
  etaStart.setDate(etaStart.getDate() + 3);
  const etaEnd = new Date(placed);
  etaEnd.setDate(etaEnd.getDate() + 5);

  return (
    <div className="mx-auto max-w-[520px] animate-[fadeInUp_500ms_both] py-16 text-center">
      <div
        className={`clip-cyber mx-auto mb-7 flex size-20 items-center justify-center border ${
          confirmed
            ? "border-success bg-success-muted"
            : "border-border bg-elevated"
        }`}
        style={
          confirmed ? { boxShadow: "0 0 30px rgba(22,199,122,0.25)" } : undefined
        }
      >
        {confirmed ? (
          <Check size={30} className="text-success" strokeWidth={2.5} />
        ) : (
          <Loader2 size={28} className="animate-spin text-primary" />
        )}
      </div>

      <h1 className="font-display text-[28px] font-black uppercase tracking-[0.02em] text-fg-1 sm:text-[32px]">
        {confirmed ? "Order Confirmed" : "Finalizing Order"}
      </h1>
      <p className="mx-auto mt-2.5 max-w-[42ch] font-body text-[14px] leading-[1.6] text-fg-2">
        {confirmed ? (
          <>
            Thanks! Your order has been placed. We&apos;ll send a confirmation to{" "}
            <span className="text-fg-1">{order.email}</span> shortly.
          </>
        ) : (
          <>Confirming your payment — this only takes a moment.</>
        )}
      </p>

      <div className="clip-cyber mt-7 border border-border bg-surface px-7 py-5 text-left">
        {[
          {
            k: "Order Number",
            v: (
              <span className="font-mono font-semibold text-primary">
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
            <span className="font-body text-[12px] uppercase tracking-[0.06em] text-fg-3">
              {row.k}
            </span>
            <span className="font-body text-[13px] text-fg-1">{row.v}</span>
          </div>
        ))}
        <div className="flex items-center justify-between border-t border-border py-2.5 pt-3">
          <span className="font-body text-[12px] uppercase tracking-[0.06em] text-fg-3">
            Status
          </span>
          <Badge variant={confirmed ? "confirmed" : "pending"} />
        </div>
      </div>

      <div className="mt-7 flex justify-center gap-3">
        <Link href="/account/orders" className={buttonVariants()}>
          View Orders
        </Link>
        <Link href="/" className={buttonVariants({ variant: "secondary" })}>
          Continue Shopping
        </Link>
      </div>
    </div>
  );
}
