import Link from "next/link";
import { notFound } from "next/navigation";
import { ArrowLeft } from "lucide-react";
import { getOrder, OrderNotFoundError } from "@/lib/orders/admin-client";
import { formatCents, formatDateTime } from "@/lib/format";
import { OrderStatusBadge } from "@/components/admin/order-status-badge";

export default async function OrderDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const orderId = Number(id);
  if (!Number.isFinite(orderId)) notFound();

  let order;
  try {
    order = await getOrder(orderId);
  } catch (err) {
    if (err instanceof OrderNotFoundError) notFound();
    throw err;
  }

  const s = order.shipping;

  return (
    <div className="max-w-[860px]">
      <Link
        href="/orders"
        className="inline-flex items-center gap-2 font-body text-[12px] text-fg-3 hover:text-fg-1"
      >
        <ArrowLeft className="size-4" /> Back to orders
      </Link>

      <div className="mt-4 flex flex-wrap items-center justify-between gap-3">
        <h1 className="font-mono text-[22px] font-bold text-fg-1">{order.order_number}</h1>
        <OrderStatusBadge status={order.status} />
      </div>
      <p className="mt-1 font-body text-[12px] text-fg-3">
        Placed {formatDateTime(order.created_at)} · {order.user_id}
      </p>

      <div className="mt-6 overflow-hidden border border-border bg-surface clip-cyber">
        <table className="w-full text-left">
          <thead>
            <tr className="border-b border-border font-display text-[10px] uppercase tracking-[0.1em] text-fg-3">
              <th className="px-4 py-3 font-semibold">Item</th>
              <th className="px-4 py-3 font-semibold">SKU</th>
              <th className="px-4 py-3 text-right font-semibold">Unit</th>
              <th className="px-4 py-3 text-right font-semibold">Qty</th>
              <th className="px-4 py-3 text-right font-semibold">Total</th>
            </tr>
          </thead>
          <tbody className="font-body text-[13px] text-fg-1">
            {order.items.map((li) => (
              <tr key={li.product_id} className="border-b border-border/50 last:border-0">
                <td className="px-4 py-3">{li.name}</td>
                <td className="px-4 py-3 font-mono text-fg-2">{li.sku}</td>
                <td className="px-4 py-3 text-right font-mono">
                  {formatCents(li.unit_price_cents, order.currency)}
                </td>
                <td className="px-4 py-3 text-right font-mono">{li.quantity}</td>
                <td className="px-4 py-3 text-right font-mono">
                  {formatCents(li.total_cents, order.currency)}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      <div className="mt-6 grid grid-cols-1 gap-6 sm:grid-cols-2">
        <div className="border border-border bg-surface px-5 py-4 clip-cyber-sm">
          <h2 className="font-display text-[11px] font-bold uppercase tracking-[0.1em] text-fg-2">
            Shipping
          </h2>
          <address className="mt-3 font-body text-[13px] not-italic leading-relaxed text-fg-1">
            {s.name}
            <br />
            {s.line1}
            {s.line2 ? (
              <>
                <br />
                {s.line2}
              </>
            ) : null}
            <br />
            {s.city}, {s.state} {s.postal_code}
            <br />
            {s.country}
          </address>
        </div>

        <div className="border border-border bg-surface px-5 py-4 clip-cyber-sm">
          <h2 className="font-display text-[11px] font-bold uppercase tracking-[0.1em] text-fg-2">
            Totals
          </h2>
          <dl className="mt-3 space-y-2 font-body text-[13px]">
            <Row label="Subtotal" value={formatCents(order.subtotal_cents, order.currency)} />
            <Row label="Tax" value={formatCents(order.tax_cents, order.currency)} />
            <Row label="Shipping" value={formatCents(order.shipping_cents, order.currency)} />
            <div className="border-t border-border pt-2">
              <Row
                label="Total"
                value={formatCents(order.total_cents, order.currency)}
                strong
              />
            </div>
          </dl>
        </div>
      </div>
    </div>
  );
}

function Row({ label, value, strong }: { label: string; value: string; strong?: boolean }) {
  return (
    <div className="flex items-center justify-between">
      <dt className="text-fg-3">{label}</dt>
      <dd className={strong ? "font-mono font-bold text-fg-1" : "font-mono text-fg-1"}>{value}</dd>
    </div>
  );
}
