"use client";

import { useEffect, useRef, useState } from "react";
import Link from "next/link";
import { ChevronDown } from "lucide-react";
import { cn } from "@gg/ui";
import { CATEGORY_GROUPS } from "./nav-items";

// Desktop "Shop All" mega-menu: one trigger opens a full-width panel grouping all
// categories. Scales as categories grow (keeps the bar clean). Hidden on mobile —
// the hamburger menu lists the same groups.
export function ShopMenu() {
  const [open, setOpen] = useState(false);
  const ref = useRef<HTMLDivElement>(null);

  // Close on outside click + Escape.
  useEffect(() => {
    if (!open) return;
    function onDown(e: MouseEvent) {
      if (ref.current && !ref.current.contains(e.target as Node)) setOpen(false);
    }
    function onKey(e: KeyboardEvent) {
      if (e.key === "Escape") setOpen(false);
    }
    document.addEventListener("mousedown", onDown);
    document.addEventListener("keydown", onKey);
    return () => {
      document.removeEventListener("mousedown", onDown);
      document.removeEventListener("keydown", onKey);
    };
  }, [open]);

  return (
    <div ref={ref}>
      <button
        onClick={() => setOpen((o) => !o)}
        aria-expanded={open}
        aria-haspopup="true"
        className={cn(
          "flex items-center gap-1.5 py-1",
          "font-[family-name:var(--font-display)] text-[12px] font-bold uppercase tracking-[0.12em]",
          "transition-colors duration-150",
          open ? "text-primary" : "text-fg-1 hover:text-primary",
        )}
      >
        Shop All
        <ChevronDown
          size={14}
          className={cn("transition-transform duration-200", open && "rotate-180")}
        />
      </button>

      {open && (
        <>
          {/* Backdrop dims the page below the nav */}
          <div
            aria-hidden="true"
            className="fixed inset-0 top-[60px] z-[150] bg-[var(--color-overlay)] backdrop-blur-[2px]"
            onClick={() => setOpen(false)}
          />
          {/* Full-width mega panel */}
          <div className="fixed left-0 right-0 top-[60px] z-[160] animate-[slideDown_200ms_ease_both] border-b border-border bg-surface shadow-[var(--shadow-card)]">
            <div className="mx-auto grid max-w-[1200px] grid-cols-1 gap-8 px-8 py-8 sm:grid-cols-2 lg:grid-cols-3">
              {CATEGORY_GROUPS.map((group) => (
                <div key={group.title}>
                  <div className="mb-4 flex items-center gap-2">
                    <span className="h-3 w-[3px] bg-primary" aria-hidden="true" />
                    <h3 className="font-[family-name:var(--font-display)] text-[11px] font-semibold uppercase tracking-[0.14em] text-fg-3">
                      {group.title}
                    </h3>
                  </div>
                  <ul className="grid grid-cols-2 gap-x-4 gap-y-1 lg:grid-cols-1">
                    {group.items.map((item) => (
                      <li key={item.href}>
                        <Link
                          href={item.href}
                          onClick={() => setOpen(false)}
                          className="group flex items-center gap-3 px-2 py-2 text-fg-1 transition-colors duration-150 hover:bg-primary-muted hover:text-primary"
                        >
                          <span
                            aria-hidden="true"
                            className="flex size-7 shrink-0 items-center justify-center border border-border bg-elevated text-[13px] text-fg-2 transition-colors group-hover:border-primary group-hover:text-primary"
                          >
                            {item.icon}
                          </span>
                          <span className="font-[family-name:var(--font-body)] text-[13px] font-medium tracking-[0.02em]">
                            {item.label}
                          </span>
                        </Link>
                      </li>
                    ))}
                  </ul>
                </div>
              ))}
            </div>
          </div>
        </>
      )}
    </div>
  );
}
