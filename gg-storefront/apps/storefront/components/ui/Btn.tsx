'use client'
import { cn } from '@gg/ui'

type Variant = 'primary' | 'secondary' | 'ghost' | 'danger'
type Size    = 'sm' | 'md' | 'lg'

interface BtnProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: Variant
  size?: Size
}

const sizeClasses: Record<Size, string> = {
  sm: 'px-4 py-2 text-[11px]',
  md: 'px-[22px] py-[11px] text-[12px]',
  lg: 'px-7 py-[14px] text-[13px]',
}

export function Btn({ variant = 'primary', size = 'md', className, children, disabled, ...props }: BtnProps) {
  const base =
    'clip-cyber-btn inline-flex items-center justify-center gap-2 font-display font-bold tracking-[0.1em] uppercase transition-all duration-[180ms] ease-[cubic-bezier(0.16,1,0.3,1)] hover:-translate-y-px active:scale-[0.96] disabled:opacity-40 disabled:cursor-not-allowed border-none cursor-pointer'

  const variants: Record<Variant, string> = {
    primary:   'bg-primary text-[var(--fg-inverse)] hover:bg-[#e8ff1a] hover:shadow-[0_4px_24px_var(--primary-glow)]',
    secondary: 'bg-transparent border border-[var(--border-bright)] text-[var(--text)] hover:bg-[var(--primary-subtle)] hover:border-primary hover:text-primary',
    ghost:     'bg-transparent text-[var(--text-muted)] hover:text-[var(--text)]',
    danger:    'bg-danger text-white',
  }

  return (
    <button
      disabled={disabled}
      className={cn(base, sizeClasses[size], variants[variant], className)}
      {...props}
    >
      {children}
    </button>
  )
}
