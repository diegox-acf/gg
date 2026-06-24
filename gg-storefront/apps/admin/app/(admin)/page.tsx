const PLACEHOLDER_METRICS = [
  { label: "Revenue (confirmed)", hint: "All-time paid orders" },
  { label: "Orders", hint: "By status" },
  { label: "Low stock", hint: "Below threshold" },
  { label: "Products", hint: "Live catalog" },
];

// Dashboard shell. Metric cards + recent-orders table are wired to the Orders/Inventory
// admin endpoints in PR4; for now they render as a layout skeleton.
export default function DashboardPage() {
  return (
    <div>
      <h1 className="font-display text-[22px] font-extrabold uppercase tracking-[0.06em] text-fg-1">
        Dashboard
      </h1>
      <p className="mt-1 font-body text-[13px] text-fg-3">
        Operations overview for GG Gaming.
      </p>

      <div className="mt-6 grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
        {PLACEHOLDER_METRICS.map((m) => (
          <div
            key={m.label}
            className="border border-border bg-surface px-5 py-4 clip-cyber-sm"
          >
            <p className="font-display text-[10px] font-semibold uppercase tracking-[0.12em] text-fg-3">
              {m.label}
            </p>
            <p className="mt-2 font-display text-[26px] font-extrabold text-fg-1">—</p>
            <p className="mt-1 font-body text-[11px] text-fg-3">{m.hint}</p>
          </div>
        ))}
      </div>
    </div>
  );
}
