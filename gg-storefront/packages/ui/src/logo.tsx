import { cn } from "./utils";

export type LogoSize = "nav" | "lg" | "xl";

export interface LogoProps {
  size?: LogoSize;
  className?: string;
}

const SIZE_MAP: Record<
  LogoSize,
  {
    blockClass: string;
    blockFont: string;
    wordmarkFont: string;
    wordmarkTracking: string;
    clipClass: string;
  }
> = {
  nav: {
    blockClass: "px-[8px] py-[4px]",
    blockFont: "text-[13px]",
    wordmarkFont: "text-[11px]",
    wordmarkTracking: "tracking-[0.18em]",
    clipClass: "clip-logo-nav",
  },
  lg: {
    blockClass: "px-[10px] py-[6px]",
    blockFont: "text-[20px]",
    wordmarkFont: "text-[14px]",
    wordmarkTracking: "tracking-[0.20em]",
    clipClass: "clip-logo-block",
  },
  xl: {
    blockClass: "px-[14px] py-[8px]",
    blockFont: "text-[28px]",
    wordmarkFont: "text-[18px]",
    wordmarkTracking: "tracking-[0.22em]",
    clipClass: "clip-logo-block",
  },
};

export function Logo({ size = "nav", className }: LogoProps) {
  const s = SIZE_MAP[size];

  return (
    <div className={cn("flex items-center gap-[10px] select-none", className)}>
      {/* GG accent block */}
      <div
        className={cn(
          s.clipClass,
          s.blockClass,
          "bg-primary text-fg-inverse",
          "font-[family-name:var(--font-display)] font-black uppercase leading-none tracking-[0.12em]",
          s.blockFont,
        )}
      >
        GG
      </div>

      {/* GAMING wordmark */}
      <span
        className={cn(
          "font-[family-name:var(--font-body)] font-medium uppercase text-fg-1",
          s.wordmarkFont,
          s.wordmarkTracking,
        )}
      >
        GAMING
      </span>

      {/* Barcode decoration */}
      <div
        aria-hidden="true"
        className="h-[18px] w-[60px] flex-shrink-0 opacity-20"
        style={{
          backgroundImage:
            "repeating-linear-gradient(90deg, var(--text-muted) 0, var(--text-muted) 1.5px, transparent 1.5px, transparent 4px, var(--text-muted) 4px, var(--text-muted) 5.5px, transparent 5.5px, transparent 9px)",
        }}
      />
    </div>
  );
}
