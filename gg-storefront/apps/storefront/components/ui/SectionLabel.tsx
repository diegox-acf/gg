export function SectionLabel({ children }: { children: React.ReactNode }) {
  return (
    <div className="flex items-center gap-[10px] mb-4">
      <div className="w-[3px] h-4 shrink-0" style={{ background: 'var(--primary)' }} />
      <span
        className="font-display font-bold text-[13px] tracking-[0.1em] uppercase"
        style={{ color: 'var(--text)' }}
      >
        {children}
      </span>
    </div>
  )
}
