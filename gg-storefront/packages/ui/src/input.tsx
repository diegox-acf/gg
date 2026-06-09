import { cn } from "./utils";

export interface InputProps
  extends React.InputHTMLAttributes<HTMLInputElement> {
  label?: string;
  error?: string;
  hint?: string;
  containerClassName?: string;
}

export function Input({
  label,
  error,
  hint,
  containerClassName,
  className,
  id,
  ...rest
}: InputProps) {
  const inputId = id ?? (label ? label.toLowerCase().replace(/\s+/g, "-") : undefined);

  return (
    <div className={cn("group flex flex-col", containerClassName)}>
      {label && (
        <label
          htmlFor={inputId}
          className="mb-[6px] block font-display text-[9px] font-semibold uppercase tracking-[0.12em] text-fg-3 transition-colors duration-150 group-focus-within:text-primary"
        >
          {label}
        </label>
      )}
      <input
        id={inputId}
        className={cn(
          "w-full bg-elevated text-fg-1 placeholder:text-fg-3",
          "border border-border px-[14px] py-[10px]",
          "font-body text-[13px]",
          "clip-cyber-input rounded-none outline-none",
          "transition-[border-color] duration-150",
          "focus:border-primary",
          error && "border-danger focus:border-danger",
          "disabled:cursor-not-allowed disabled:opacity-35",
          className,
        )}
        {...rest}
      />
      {error && (
        <p className="mt-[5px] font-body text-[11px] text-danger">
          {error}
        </p>
      )}
      {!error && hint && (
        <p className="mt-[5px] font-body text-[11px] text-fg-3">
          {hint}
        </p>
      )}
    </div>
  );
}
