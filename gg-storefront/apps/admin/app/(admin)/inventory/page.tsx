import Link from "next/link";
import { cn } from "@gg/ui";
import { listStock } from "@/lib/inventory/admin-client";
import { formatDateTime } from "@/lib/format";
import { Pagination } from "@/components/admin/pagination";

const SIZE = 25;
const THRESHOLD = 5;

export default async function InventoryPage({
  searchParams,
}: {
  searchParams: Promise<{ low_stock?: string; page?: string }>;
}) {
  const sp = await searchParams;
  const lowStock = sp.low_stock === "true";
  const page = Math.max(parseInt(sp.page ?? "0", 10) || 0, 0);

  let data: Awaited<ReturnType<typeof listStock>> | null = null;
  let error = false;
  try {
    data = await listStock({ lowStock, threshold: THRESHOLD, page, size: SIZE });
  } catch {
    error = true;
  }

  const toggleCls = (on: boolean) =>
    cn(
      "px-3 py-[6px] font-display text-[10px] font-semibold uppercase tracking-[0.1em] border transition-colors clip-cyber-xs",
      on
        ? "border-primary bg-primary/10 text-primary"
        : "border-border text-fg-3 hover:border-border-strong hover:text-fg-1",
    );

  return (
    <div>
      <h1 className="font-display text-[22px] font-extrabold uppercase tracking-[0.06em] text-fg-1">
        Inventory
      </h1>

      <div className="mt-5 flex gap-2">
        <Link href="/inventory" className={toggleCls(!lowStock)}>
          All stock
        </Link>
        <Link href="/inventory?low_stock=true" className={toggleCls(lowStock)}>
          Low stock (≤ {THRESHOLD})
        </Link>
      </div>

      {error || !data ? (
        <p className="mt-6 border border-danger/40 bg-danger/10 px-4 py-3 font-body text-[13px] text-danger">
          Couldn&apos;t load stock — the Inventory service may be unreachable.
        </p>
      ) : (
        <>
          <p className="mt-4 font-body text-[12px] text-fg-3">
            {data.total_elements} stock record{data.total_elements === 1 ? "" : "s"}
          </p>
          <div className="mt-2 overflow-hidden border border-border bg-surface clip-cyber">
            <table className="w-full text-left">
              <thead>
                <tr className="border-b border-border font-display text-[10px] uppercase tracking-[0.1em] text-fg-3">
                  <th className="px-4 py-3 font-semibold">Product ID</th>
                  <th className="px-4 py-3 text-right font-semibold">Available</th>
                  <th className="px-4 py-3 text-right font-semibold">Reserved</th>
                  <th className="px-4 py-3 font-semibold">Updated</th>
                </tr>
              </thead>
              <tbody className="font-body text-[13px] text-fg-1">
                {data.items.length === 0 ? (
                  <tr>
                    <td colSpan={4} className="px-4 py-8 text-center text-fg-3">
                      No stock records.
                    </td>
                  </tr>
                ) : (
                  data.items.map((s) => {
                    const low = s.available <= THRESHOLD;
                    return (
                      <tr
                        key={s.product_id}
                        className="border-b border-border/50 last:border-0 hover:bg-elevated"
                      >
                        <td className="px-4 py-3 font-mono">{s.product_id}</td>
                        <td
                          className={cn(
                            "px-4 py-3 text-right font-mono",
                            low ? "text-warning" : "text-fg-1",
                          )}
                        >
                          {s.available}
                        </td>
                        <td className="px-4 py-3 text-right font-mono text-fg-2">{s.reserved}</td>
                        <td className="px-4 py-3 text-fg-2">{formatDateTime(s.updated_at)}</td>
                      </tr>
                    );
                  })
                )}
              </tbody>
            </table>
          </div>
          <Pagination
            basePath="/inventory"
            params={{ low_stock: lowStock ? "true" : undefined }}
            page={data.page}
            totalPages={data.total_pages}
          />
        </>
      )}
    </div>
  );
}
