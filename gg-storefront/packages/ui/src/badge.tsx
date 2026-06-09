import { cn } from "./utils";

export type BadgeVariant =
  | "in-stock"
  | "low-stock"
  | "out-of-stock"
  | "new"
  | "sale"
  | "pending"
  | "confirmed"
  | "failed"
  | "neutral";

export interface BadgeProps {
  variant: BadgeVariant;
  label?: string;
  className?: string;
}

type BadgeConfig = {
  bg: string;
  text: string;
  border?: string;
  dot: boolean;
  pulse: boolean;
  defaultLabel: string;
  font?: "display" | "body";
};

const BADGE_CONFIG: Record<BadgeVariant, BadgeConfig> = {
  "in-stock": {
    bg: "bg-success-muted",
    text: "text-success",
    dot: true,
    pulse: false,
    defaultLabel: "In Stock",
  },
  "low-stock": {
    bg: "bg-warning-muted",
    text: "text-warning",
    dot: true,
    pulse: true,
    defaultLabel: "Low Stock",
  },
  "out-of-stock": {
    bg: "bg-danger-muted",
    text: "text-danger",
    dot: true,
    pulse: false,
    defaultLabel: "Out of Stock",
  },
  new: {
    bg: "bg-primary-muted",
    text: "text-primary",
    dot: false,
    pulse: false,
    defaultLabel: "New Arrival",
  },
  sale: {
    bg: "bg-primary-muted",
    text: "text-primary",
    dot: false,
    pulse: false,
    defaultLabel: "Flash Sale",
  },
  pending: {
    bg: "bg-warning-muted",
    text: "text-warning",
    border: "border border-warning/25",
    dot: false,
    pulse: false,
    defaultLabel: "PENDING",
    font: "display",
  },
  confirmed: {
    bg: "bg-success-muted",
    text: "text-success",
    border: "border border-success/25",
    dot: false,
    pulse: false,
    defaultLabel: "CONFIRMED",
    font: "display",
  },
  failed: {
    bg: "bg-danger-muted",
    text: "text-danger",
    border: "border border-danger/25",
    dot: false,
    pulse: false,
    defaultLabel: "FAILED",
    font: "display",
  },
  neutral: {
    bg: "bg-border/20",
    text: "text-fg-2",
    dot: false,
    pulse: false,
    defaultLabel: "",
  },
};

export function Badge({ variant, label, className }: BadgeProps) {
  const cfg = BADGE_CONFIG[variant];
  const text = label ?? cfg.defaultLabel;
  const isDisplay = cfg.font === "display";

  return (
    <span
      className={cn(
        "inline-flex items-center gap-[5px]",
        "clip-cyber-badge",
        cfg.bg,
        cfg.text,
        cfg.border,
        isDisplay
          ? "px-3 py-1 text-[10px] font-display font-bold uppercase tracking-[0.1em]"
          : "px-[10px] py-[3px] text-[11px] font-body font-semibold tracking-[0.04em]",
        className,
      )}
    >
      {cfg.dot && (
        <span
          aria-hidden="true"
          className={cn(
            "size-[5px] rounded-full flex-shrink-0 bg-current",
            cfg.pulse && "animate-[lowStockPulse_1.5s_ease-in-out_infinite]",
          )}
        />
      )}
      {text}
    </span>
  );
}
