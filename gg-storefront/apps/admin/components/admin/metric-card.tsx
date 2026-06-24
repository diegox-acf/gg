// Single dashboard metric. `value` is pre-formatted; "—" signals the source service
// was unreachable (each metric degrades independently).
export function MetricCard({
  label,
  value,
  hint,
}: {
  label: string;
  value: string;
  hint?: string;
}) {
  return (
    <div className="border border-border bg-surface px-5 py-4 clip-cyber-sm">
      <p className="font-display text-[10px] font-semibold uppercase tracking-[0.12em] text-fg-3">
        {label}
      </p>
      <p className="mt-2 font-display text-[26px] font-extrabold text-fg-1">{value}</p>
      {hint && <p className="mt-1 font-body text-[11px] text-fg-3">{hint}</p>}
    </div>
  );
}
