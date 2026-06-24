// Temporary shell for sections wired up in a later PR (PR4). Keeps the nav coherent
// without 404s while the read endpoints + data wiring land.
export function SectionPlaceholder({
  title,
  note,
}: {
  title: string;
  note: string;
}) {
  return (
    <div>
      <h1 className="font-display text-[22px] font-extrabold uppercase tracking-[0.06em] text-fg-1">
        {title}
      </h1>
      <div className="mt-6 border border-dashed border-border bg-surface px-6 py-10 text-center clip-cyber">
        <p className="font-body text-[13px] text-fg-3">{note}</p>
      </div>
    </div>
  );
}
