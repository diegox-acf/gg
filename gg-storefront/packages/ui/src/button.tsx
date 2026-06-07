import { cn } from "./utils";

export type ButtonVariant = "primary" | "secondary" | "ghost" | "danger";
export type ButtonSize = "sm" | "md" | "lg";

export interface ButtonProps
  extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: ButtonVariant;
  size?: ButtonSize;
  loading?: boolean;
}

const variantClasses: Record<ButtonVariant, string> = {
  primary: [
    "bg-primary text-fg-inverse",
    "clip-cyber-btn rounded-none",
    "hover:bg-primary-hover hover:-translate-y-px hover:shadow-[0_4px_20px_rgba(255,53,0,0.30)]",
    "active:scale-[0.96]",
  ].join(" "),
  secondary: [
    "bg-transparent text-fg-1 border border-border",
    "clip-cyber-btn rounded-none",
    "hover:bg-primary-muted hover:text-primary hover:border-primary",
    "active:scale-[0.96]",
  ].join(" "),
  ghost: [
    "bg-transparent text-fg-2 border-none rounded-none",
    "hover:text-fg-1",
    "active:scale-[0.96]",
  ].join(" "),
  danger: [
    "bg-danger text-white",
    "clip-cyber-btn rounded-none",
    "hover:brightness-110 hover:-translate-y-px",
    "active:scale-[0.96]",
  ].join(" "),
};

const sizeClasses: Record<ButtonSize, string> = {
  sm: "px-4 py-2 text-[10px]",
  md: "px-[22px] py-[11px] text-[11px]",
  lg: "px-7 py-[14px] text-[12px]",
};

export function Button({
  variant = "primary",
  size = "md",
  loading = false,
  disabled,
  className,
  children,
  ...rest
}: ButtonProps) {
  return (
    <button
      disabled={disabled || loading}
      className={cn(
        "relative inline-flex items-center justify-center gap-2",
        "font-[family-name:var(--font-display)] font-bold uppercase tracking-[0.1em]",
        "transition-all duration-[180ms] ease-[cubic-bezier(0.16,1,0.3,1)]",
        "cursor-pointer select-none",
        "disabled:opacity-35 disabled:cursor-not-allowed disabled:pointer-events-none",
        variantClasses[variant],
        sizeClasses[size],
        loading && "text-transparent pointer-events-none",
        className,
      )}
      {...rest}
    >
      {children}
      {loading && (
        <span
          aria-hidden="true"
          className="absolute inset-0 m-auto size-[13px] rounded-full border-2 border-current/30 border-t-current animate-[spin_0.6s_linear_infinite]"
        />
      )}
    </button>
  );
}

/** Returns Tailwind classes for a button variant — use with <Link> or other elements */
export function buttonVariants({
  variant = "primary",
  size = "md",
  className,
}: {
  variant?: ButtonVariant;
  size?: ButtonSize;
  className?: string;
} = {}) {
  return cn(
    "inline-flex items-center justify-center gap-2",
    "font-[family-name:var(--font-display)] font-bold uppercase tracking-[0.1em]",
    "transition-all duration-[180ms] ease-[cubic-bezier(0.16,1,0.3,1)]",
    "cursor-pointer select-none no-underline",
    variantClasses[variant],
    sizeClasses[size],
    className,
  );
}
