"use client";

import { useEffect, useRef, useState } from "react";
import Link from "next/link";
import { ChevronDown } from "lucide-react";
import { cn } from "@gg/ui";
import { CATEGORY_GROUPS, type NavGroup } from "./nav-items";

// Desktop category nav: one dropdown per group, spread across the bar. Hidden on
// mobile — the hamburger menu lists the same groups. One open at a time.
export function CategoryNav() {
  const [openIdx, setOpenIdx] = useState<number | null>(null);
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (openIdx === null) return;
    function onDown(e: MouseEvent) {
      if (ref.current && !ref.current.contains(e.target as Node)) setOpenIdx(null);
    }
    function onKey(e: KeyboardEvent) {
      if (e.key === "Escape") setOpenIdx(null);
    }
    document.addEventListener("mousedown", onDown);
    document.addEventListener("keydown", onKey);
    return () => {
      document.removeEventListener("mousedown", onDown);
      document.removeEventListener("keydown", onKey);
    };
  }, [openIdx]);

  return (
    <div ref={ref} className="flex items-center gap-8">
      {CATEGORY_GROUPS.map((group, i) => (
        <GroupDropdown
          key={group.title}
          group={group}
          open={openIdx === i}
          onToggle={() => setOpenIdx((cur) => (cur === i ? null : i))}
          onHover={() => setOpenIdx((cur) => (cur === null ? cur : i))}
          onClose={() => setOpenIdx(null)}
        />
      ))}
    </div>
  );
}

function GroupDropdown({
  group,
  open,
  onToggle,
  onHover,
  onClose,
}: {
  group: NavGroup;
  open: boolean;
  onToggle: () => void;
  onHover: () => void;
  onClose: () => void;
}) {
  const twoCol = group.items.length > 4;

  return (
    <div className="relative" onMouseEnter={onHover}>
      <button
        onClick={onToggle}
        aria-expanded={open}
        aria-haspopup="true"
        className={cn(
          "flex items-center gap-1.5 py-1",
          "font-[family-name:var(--font-body)] text-[12px] font-medium uppercase tracking-[0.1em]",
          "transition-colors duration-150",
          open ? "text-primary" : "text-fg-2 hover:text-primary",
        )}
      >
        {group.title}
        <ChevronDown
          size={13}
          className={cn("transition-transform duration-200", open && "rotate-180")}
        />
      </button>

      {open && (
        <div
          className={cn(
            "absolute left-0 top-[calc(100%+10px)] z-[160]",
            "animate-[slideDown_180ms_ease_both]",
            "border border-border bg-surface p-2 shadow-[var(--shadow-card)]",
            twoCol ? "w-[360px]" : "w-[210px]",
          )}
        >
          <ul className={cn("grid gap-x-2 gap-y-0.5", twoCol ? "grid-cols-2" : "grid-cols-1")}>
            {group.items.map((item) => (
              <li key={item.href}>
                <Link
                  href={item.href}
                  onClick={onClose}
                  className="group flex items-center gap-2.5 px-2 py-2 text-fg-1 transition-colors duration-150 hover:bg-primary-muted hover:text-primary"
                >
                  <span
                    aria-hidden="true"
                    className="flex size-6 shrink-0 items-center justify-center border border-border bg-elevated text-[12px] text-fg-2 transition-colors group-hover:border-primary group-hover:text-primary"
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
      )}
    </div>
  );
}
