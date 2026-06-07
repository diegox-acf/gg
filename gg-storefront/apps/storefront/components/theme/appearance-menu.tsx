"use client";

import { useEffect, useRef, useState } from "react";
import { Palette } from "lucide-react";
import { cn } from "@gg/ui";
import { AppearanceControls } from "./appearance-controls";

/** Desktop nav affordance: a button that opens the appearance popover. */
export function AppearanceMenu() {
  const [open, setOpen] = useState(false);
  const ref = useRef<HTMLDivElement>(null);

  // Close on outside click or Escape.
  useEffect(() => {
    if (!open) return;
    function onPointer(e: MouseEvent) {
      if (ref.current && !ref.current.contains(e.target as Node)) setOpen(false);
    }
    function onKey(e: KeyboardEvent) {
      if (e.key === "Escape") setOpen(false);
    }
    document.addEventListener("mousedown", onPointer);
    document.addEventListener("keydown", onKey);
    return () => {
      document.removeEventListener("mousedown", onPointer);
      document.removeEventListener("keydown", onKey);
    };
  }, [open]);

  return (
    <div ref={ref} className="relative">
      <button
        type="button"
        aria-label="Appearance"
        aria-haspopup="dialog"
        aria-expanded={open}
        onClick={() => setOpen((o) => !o)}
        className={cn(
          "flex items-center p-2 transition-all duration-150",
          open
            ? "clip-cyber-badge bg-primary-muted text-primary"
            : "bg-transparent text-fg-2 hover:text-primary",
        )}
      >
        <Palette size={17} strokeWidth={1.75} />
      </button>

      {open && (
        <div
          role="dialog"
          aria-label="Appearance settings"
          className="clip-cyber absolute right-0 top-[calc(100%+10px)] z-[200] w-64 animate-[slideDown_160ms_ease_both] border border-border bg-surface p-5 shadow-[var(--shadow-card)]"
        >
          <AppearanceControls />
        </div>
      )}
    </div>
  );
}
