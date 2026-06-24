import Link from "next/link";
import { cn } from "@gg/ui";
import { listOrders } from "@/lib/orders/admin-client";
import { formatCents, formatDateTime } from "@/lib/format";
import { OrderStatusBadge } from "@/components/admin/order-status-badge";
import { Pagination } from "@/components/admin/pagination";

const SIZE = 20;
const FILTERS = ["ALL", "PENDING", "RESERVING", "PAYING", "CONFIRMED", "FAILED"] as const;

export default async function OrdersPage({
  searchParams,
}: {
  searchParams: Promise<{ status?: string; page?: string }>;
}) {
  const sp = await searchParams;
  const active = (sp.status ?? "ALL").toUpperCase();
  const status = active !== "ALL" ? active : undefined;
  const page = Math.max(parseInt(sp.page ?? "0", 10) || 0, 0);

  let data: Awaited<ReturnType<typeof listOrders>> | null = null;
  let error = false;
  try {
    data = await listOrders({ status, page, size: SIZE });
  } catch {
    error = true;
  }

  return (
    <div>
      <h1 className="font-display text-[22px] font-extrabold uppercase tracking-[0.06em] text-fg-1">
        Orders
      </h1>

      <div className="mt-5 flex flex-wrap gap-2">
        {FILTERS.map((f) => {
          const isActive = active === f;
          return (
            <Link
              key={f}
              href={f === "ALL" ? "/orders" : `/orders?status=${f}`}
              className={cn(
                "px-3 py-[6px] font-display text-[10px] font-semibold uppercase tracking-[0.1em] border transition-colors clip-cyber-xs",
                isActive
                  ? "border-primary bg-primary/10 text-primary"
                  : "border-border text-fg-3 hover:border-border-strong hover:text-fg-1",
              )}
            >
              {f}
            </Link>
          );
        })}
      </div>

      {error || !data ? (
        <p className="mt-6 border border-danger/40 bg-danger/10 px-4 py-3 font-body text-[13px] text-danger">
          Couldn&apos;t load orders — the Orders service may be unreachable.
        </p>
      ) : (
        <>
          <p className="mt-4 font-body text-[12px] text-fg-3">
            {data.total_elements} order{data.total_elements === 1 ? "" : "s"}
          </p>
          <div className="mt-2 overflow-hidden border border-border bg-surface clip-cyber">
            <table className="w-full text-left">
              <thead>
                <tr className="border-b border-border font-display text-[10px] uppercase tracking-[0.1em] text-fg-3">
                  <th className="px-4 py-3 font-semibold">Order</th>
                  <th className="px-4 py-3 font-semibold">Customer</th>
                  <th className="px-4 py-3 font-semibold">Status</th>
                  <th className="px-4 py-3 text-right font-semibold">Total</th>
                  <th className="px-4 py-3 font-semibold">Placed</th>
                </tr>
              </thead>
              <tbody className="font-body text-[13px] text-fg-1">
                {data.items.length === 0 ? (
                  <tr>
                    <td colSpan={5} className="px-4 py-8 text-center text-fg-3">
                      No orders match this filter.
                    </td>
                  </tr>
                ) : (
                  data.items.map((o) => (
                    <tr
                      key={o.id}
                      className="border-b border-border/50 last:border-0 hover:bg-elevated"
                    >
                      <td className="px-4 py-3">
                        <Link
                          href={`/orders/${o.id}`}
                          className="font-mono text-primary hover:underline"
                        >
                          {o.order_number}
                        </Link>
                      </td>
                      <td className="max-w-[200px] truncate px-4 py-3 text-fg-2" title={o.user_id}>
                        {o.user_id}
                      </td>
                      <td className="px-4 py-3">
                        <OrderStatusBadge status={o.status} />
                      </td>
                      <td className="px-4 py-3 text-right font-mono">
                        {formatCents(o.total_cents, o.currency)}
                      </td>
                      <td className="px-4 py-3 text-fg-2">{formatDateTime(o.created_at)}</td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
          <Pagination
            basePath="/orders"
            params={{ status }}
            page={data.page}
            totalPages={data.total_pages}
          />
        </>
      )}
    </div>
  );
}
