import Link from "next/link";
import { cn } from "@gg/ui";

// Link-based pager that preserves existing query params (e.g. status / low_stock).
export function Pagination({
  basePath,
  params,
  page,
  totalPages,
}: {
  basePath: string;
  params: Record<string, string | undefined>;
  page: number;
  totalPages: number;
}) {
  if (totalPages <= 1) return null;

  const href = (p: number) => {
    const qs = new URLSearchParams();
    for (const [k, v] of Object.entries(params)) {
      if (v) qs.set(k, v);
    }
    qs.set("page", String(p));
    return `${basePath}?${qs.toString()}`;
  };

  const linkCls =
    "px-3 py-2 font-display text-[11px] font-semibold uppercase tracking-[0.1em] border border-border-strong transition-colors clip-cyber-xs";
  const disabledCls = "pointer-events-none opacity-40";

  return (
    <div className="mt-5 flex items-center justify-between">
      <Link
        href={href(page - 1)}
        className={cn(linkCls, "hover:border-primary hover:text-primary", page <= 0 && disabledCls)}
        aria-disabled={page <= 0}
      >
        Prev
      </Link>
      <span className="font-body text-[12px] text-fg-3">
        Page {page + 1} of {totalPages}
      </span>
      <Link
        href={href(page + 1)}
        className={cn(
          linkCls,
          "hover:border-primary hover:text-primary",
          page >= totalPages - 1 && disabledCls,
        )}
        aria-disabled={page >= totalPages - 1}
      >
        Next
      </Link>
    </div>
  );
}
