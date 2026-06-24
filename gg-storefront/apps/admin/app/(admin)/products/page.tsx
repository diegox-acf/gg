import { fetchProducts } from "@/lib/catalog/client";
import { formatCents } from "@/lib/format";
import { StockStatusBadge } from "@/components/admin/stock-status-badge";

// Read-only catalog view. The catalog list API paginates by opaque token rather than
// page number, so this shows a generous first page (the catalog is a few hundred items).
const PAGE_SIZE = 500;

export default async function ProductsPage() {
  let products: Awaited<ReturnType<typeof fetchProducts>>["products"] = null;
  let error = false;
  try {
    products = (await fetchProducts({ pageSize: PAGE_SIZE })).products;
  } catch {
    error = true;
  }

  return (
    <div>
      <h1 className="font-display text-[22px] font-extrabold uppercase tracking-[0.06em] text-fg-1">
        Products
      </h1>

      {error ? (
        <p className="mt-6 border border-danger/40 bg-danger/10 px-4 py-3 font-body text-[13px] text-danger">
          Couldn&apos;t load products — the Catalog service may be unreachable.
        </p>
      ) : (
        <>
          <p className="mt-4 font-body text-[12px] text-fg-3">
            {products?.length ?? 0} product{(products?.length ?? 0) === 1 ? "" : "s"}
          </p>
          <div className="mt-2 overflow-hidden border border-border bg-surface clip-cyber">
            <table className="w-full text-left">
              <thead>
                <tr className="border-b border-border font-display text-[10px] uppercase tracking-[0.1em] text-fg-3">
                  <th className="px-4 py-3 font-semibold">Product</th>
                  <th className="px-4 py-3 font-semibold">SKU</th>
                  <th className="px-4 py-3 font-semibold">Brand</th>
                  <th className="px-4 py-3 text-right font-semibold">Price</th>
                  <th className="px-4 py-3 font-semibold">Stock</th>
                </tr>
              </thead>
              <tbody className="font-body text-[13px] text-fg-1">
                {!products || products.length === 0 ? (
                  <tr>
                    <td colSpan={5} className="px-4 py-8 text-center text-fg-3">
                      No products.
                    </td>
                  </tr>
                ) : (
                  products.map((p) => (
                    <tr
                      key={p.id}
                      className="border-b border-border/50 last:border-0 hover:bg-elevated"
                    >
                      <td className="max-w-[280px] truncate px-4 py-3" title={p.name}>
                        {p.name}
                      </td>
                      <td className="px-4 py-3 font-mono text-fg-2">{p.sku}</td>
                      <td className="px-4 py-3 text-fg-2">{p.brand}</td>
                      <td className="px-4 py-3 text-right font-mono">
                        {formatCents(p.price_cents, p.currency)}
                      </td>
                      <td className="px-4 py-3">
                        <StockStatusBadge status={p.stock_status} />
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </>
      )}
    </div>
  );
}
