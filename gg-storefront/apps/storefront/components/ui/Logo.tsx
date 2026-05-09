'use client'
import Link from 'next/link'

export function Logo() {
  return (
    <Link href="/" className="flex items-center gap-[10px] select-none group">
      <div
        className="clip-cyber-xs font-display font-black text-[14px] px-[10px] py-[5px] tracking-[0.12em] transition-shadow duration-200 group-hover:shadow-[0_0_16px_var(--primary-glow)]"
        style={{
          background: 'var(--primary)',
          color: 'var(--fg-inverse)',
        }}
      >
        GG
      </div>
      <span
        className="font-sans font-medium text-[12px] tracking-[0.24em] uppercase transition-colors duration-200"
        style={{ color: 'var(--text)' }}
      >
        GAMING
      </span>
      <div
        className="w-[60px] h-[18px] opacity-20 shrink-0"
        style={{
          backgroundImage:
            'repeating-linear-gradient(90deg, var(--text-muted) 0, var(--text-muted) 1.5px, transparent 1.5px, transparent 4px, var(--text-muted) 4px, var(--text-muted) 5.5px, transparent 5.5px, transparent 9px)',
        }}
      />
    </Link>
  )
}
