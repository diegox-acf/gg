import Link from "next/link";
import { fetchOrderStats, listOrders } from "@/lib/orders/admin-client";
import { listStock } from "@/lib/inventory/admin-client";
import { fetchProducts, fetchCategories } from "@/lib/catalog/client";
import { formatCents, formatDateTime } from "@/lib/format";
import { MetricCard } from "@/components/admin/metric-card";
import { OrderStatusBadge } from "@/components/admin/order-status-badge";

// Container: fetches every metric in parallel and degrades each independently — a
// single unreachable service shows "—" rather than failing the whole dashboard.
export default async function DashboardPage() {
  const [statsR, lowStockR, productsR, categoriesR, recentR] = await Promise.allSettled([
    fetchOrderStats(),
    listStock({ lowStock: true, threshold: 5, size: 1 }),
    fetchProducts({ pageSize: 500 }),
    fetchCategories(),
    listOrders({ size: 6 }),
  ]);

  const stats = statsR.status === "fulfilled" ? statsR.value : null;
  const lowStock = lowStockR.status === "fulfilled" ? lowStockR.value.total_elements : null;
  const products =
    productsR.status === "fulfilled" ? (productsR.value.products?.length ?? 0) : null;
  const categories =
    categoriesR.status === "fulfilled" ? (categoriesR.value.categories?.length ?? 0) : null;
  const recent = recentR.status === "fulfilled" ? recentR.value.items : [];

  const dash = (n: number | null) => (n == null ? "—" : String(n));

  return (
    <div>
      <h1 className="font-display text-[22px] font-extrabold uppercase tracking-[0.06em] text-fg-1">
        Dashboard
      </h1>
      <p className="mt-1 font-body text-[13px] text-fg-3">
        Operations overview for GG Gaming.
      </p>

      <div className="mt-6 grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <MetricCard
          label="Revenue (confirmed)"
          value={stats ? formatCents(stats.revenue_cents) : "—"}
          hint="All paid orders"
        />
        <MetricCard
          label="Orders"
          value={stats ? String(stats.total_orders) : "—"}
          hint={stats ? `${stats.orders_today} today` : undefined}
        />
        <MetricCard label="Low stock" value={dash(lowStock)} hint="≤ 5 available" />
        <MetricCard
          label="Products"
          value={dash(products)}
          hint={categories != null ? `${categories} categories` : undefined}
        />
      </div>

      <div className="mt-8 flex items-center justify-between">
        <h2 className="font-display text-[13px] font-bold uppercase tracking-[0.1em] text-fg-2">
          Recent orders
        </h2>
        <Link href="/orders" className="font-body text-[12px] text-primary hover:underline">
          View all →
        </Link>
      </div>

      <div className="mt-3 overflow-hidden border border-border bg-surface clip-cyber">
        <table className="w-full text-left">
          <thead>
            <tr className="border-b border-border font-display text-[10px] uppercase tracking-[0.1em] text-fg-3">
              <th className="px-4 py-3 font-semibold">Order</th>
              <th className="px-4 py-3 font-semibold">Status</th>
              <th className="px-4 py-3 text-right font-semibold">Total</th>
              <th className="px-4 py-3 font-semibold">Placed</th>
            </tr>
          </thead>
          <tbody className="font-body text-[13px] text-fg-1">
            {recent.length === 0 ? (
              <tr>
                <td colSpan={4} className="px-4 py-8 text-center text-fg-3">
                  No orders yet.
                </td>
              </tr>
            ) : (
              recent.map((o) => (
                <tr key={o.id} className="border-b border-border/50 last:border-0 hover:bg-elevated">
                  <td className="px-4 py-3">
                    <Link href={`/orders/${o.id}`} className="font-mono text-primary hover:underline">
                      {o.order_number}
                    </Link>
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
    </div>
  );
}
