"use client";

import { useEffect, useState } from "react";
import { Check, RotateCcw } from "lucide-react";
import { cn } from "@gg/ui";
import { useTheme } from "./theme-provider";
import { ThemeToggle } from "./theme-toggle";
import {
  ACCENT_PRESETS,
  DEFAULT_ACCENT,
  isDefaultAccent,
  isValidHex,
  normalizeHex,
} from "@/lib/theme/appearance";

function SectionLabel({ children }: { children: React.ReactNode }) {
  return (
    <p className="mb-2.5 font-[family-name:var(--font-display)] text-[9px] font-semibold uppercase tracking-[0.15em] text-fg-3">
      {children}
    </p>
  );
}

/** Shared appearance UI — used inside the desktop popover and the mobile menu. */
export function AppearanceControls() {
  const { accent, setAccent } = useTheme();
  const [draft, setDraft] = useState(accent);

  // Keep the hex field in sync when accent changes via a swatch / reset.
  useEffect(() => setDraft(accent), [accent]);

  function commitDraft() {
    if (isValidHex(draft)) setAccent(draft);
    else setDraft(accent);
  }

  return (
    <div className="flex flex-col gap-5">
      {/* Theme */}
      <div>
        <SectionLabel>Theme</SectionLabel>
        <ThemeToggle />
      </div>

      {/* Accent */}
      <div>
        <div className="mb-2.5 flex items-center justify-between">
          <span className="font-[family-name:var(--font-display)] text-[9px] font-semibold uppercase tracking-[0.15em] text-fg-3">
            Accent
          </span>
          {!isDefaultAccent(accent) && (
            <button
              type="button"
              onClick={() => setAccent(DEFAULT_ACCENT)}
              className="flex items-center gap-1 font-[family-name:var(--font-body)] text-[10px] uppercase tracking-[0.08em] text-fg-3 transition-colors hover:text-fg-1"
            >
              <RotateCcw size={11} /> Reset
            </button>
          )}
        </div>

        <div className="grid grid-cols-5 gap-1.5">
          {ACCENT_PRESETS.map(({ label, value }) => {
            const active = normalizeHex(accent) === normalizeHex(value);
            return (
              <button
                key={value}
                type="button"
                title={label}
                aria-label={label}
                aria-pressed={active}
                onClick={() => setAccent(value)}
                className={cn(
                  "clip-cyber-xs flex h-7 items-center justify-center transition-transform duration-150 hover:scale-110",
                  active && "scale-110",
                )}
                style={{
                  background: value,
                  outline: active ? "2px solid var(--text)" : "none",
                  outlineOffset: 1,
                }}
              >
                {active && (
                  <Check size={12} style={{ color: "var(--fg-inverse)" }} />
                )}
              </button>
            );
          })}
        </div>

        {/* Custom hex */}
        <input
          value={draft}
          onChange={(e) => setDraft(e.target.value)}
          onBlur={commitDraft}
          onKeyDown={(e) => {
            if (e.key === "Enter") e.currentTarget.blur();
          }}
          spellCheck={false}
          aria-label="Custom accent hex color"
          placeholder="#ff3500"
          className="clip-cyber-input mt-2.5 w-full border border-border bg-elevated px-3 py-2 font-[family-name:var(--font-mono)] text-[12px] text-fg-1 outline-none transition-colors duration-150 focus:border-primary"
        />
      </div>
    </div>
  );
}
