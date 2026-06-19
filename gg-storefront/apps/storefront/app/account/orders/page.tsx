import type { Metadata } from "next";
import Link from "next/link";
import { redirect } from "next/navigation";
import { Badge, buttonVariants } from "@gg/ui";
import { auth } from "@/auth";
import { Nav } from "@/components/nav/nav";
import { listOrdersForUser, type Order, type OrderStatus } from "@/lib/orders/client";
import { formatPrice } from "@/lib/mock-data";

export const metadata: Metadata = { title: "Your orders — GG Gaming" };

const BADGE: Record<OrderStatus, "pending" | "confirmed" | "failed"> = {
  PENDING: "pending",
  RESERVING: "pending",
  PAYING: "pending",
  CONFIRMED: "confirmed",
  FAILED: "failed",
};

// Container: protected server component that fetches the user's orders from gg-orders.
export default async function OrdersPage() {
  const session = await auth();
  if (!session?.user?.id) redirect("/login?callbackUrl=/account/orders");

  let orders: Order[] = [];
  let failed = false;
  try {
    orders = await listOrdersForUser(session.user.id);
  } catch {
    failed = true;
  }

  return (
    <>
      <Nav />
      <main className="mx-auto max-w-[860px] px-4 py-12 sm:px-8">
        <div className="mb-6 flex items-center justify-between">
          <h1 className="font-display text-[24px] font-extrabold uppercase tracking-[0.08em] text-fg-1">
            Your orders
          </h1>
          <Link href="/account" className="font-body text-[13px] text-fg-2 hover:text-fg-1">
            ← Account
          </Link>
        </div>

        {failed ? (
          <p className="border border-danger bg-danger-muted px-4 py-3 font-body text-[13px] text-danger">
            We couldn&apos;t load your orders right now. Please try again shortly.
          </p>
        ) : orders.length === 0 ? (
          <div className="flex flex-col items-center gap-4 border border-dashed border-border bg-surface/40 px-6 py-20 text-center">
            <p className="font-display text-[15px] font-bold uppercase tracking-[0.08em] text-fg-1">
              No orders yet
            </p>
            <Link href="/" className={buttonVariants()}>
              Browse Products
            </Link>
          </div>
        ) : (
          <OrderList orders={orders} />
        )}
      </main>
    </>
  );
}

// Presenter: pure rendering of the fetched orders.
function OrderList({ orders }: { orders: Order[] }) {
  return (
    <ul className="flex flex-col gap-3">
      {orders.map((o) => (
        <li
          key={o.id}
          className="clip-cyber-sm flex flex-wrap items-center justify-between gap-4 border border-border bg-surface px-5 py-4"
        >
          <div>
            <p className="font-mono text-[13px] font-semibold text-primary">
              {o.order_number}
            </p>
            <p className="mt-1 font-body text-[12px] text-fg-3">
              {new Date(o.created_at).toLocaleDateString("en-US", {
                month: "short",
                day: "numeric",
                year: "numeric",
              })}{" "}
              · {o.items.reduce((n, i) => n + i.quantity, 0)} item(s)
            </p>
          </div>
          <div className="flex items-center gap-5">
            <span className="font-display text-[15px] font-extrabold text-fg-1">
              {formatPrice(o.total_cents)}
            </span>
            <Badge variant={BADGE[o.status]} />
          </div>
        </li>
      ))}
    </ul>
  );
}
