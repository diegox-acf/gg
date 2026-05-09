import Link from 'next/link'

export function PromoBanner() {
  return (
    <div
      className="clip-cyber flex items-center justify-between gap-4 flex-wrap mb-[52px] px-7 py-5"
      style={{ background: 'var(--primary)' }}
    >
      <div>
        <div
          className="font-display text-[10px] font-semibold tracking-[0.18em] uppercase mb-1 opacity-70"
          style={{ color: 'var(--fg-inverse)' }}
        >
          Flash Sale — Ends Tonight
        </div>
        <div
          className="font-display font-extrabold text-[17px] tracking-[0.02em]"
          style={{ color: 'var(--fg-inverse)' }}
        >
          Up to 15% off select GPUs &amp; peripherals
        </div>
      </div>
      <Link
        href="/category/gpus"
        className="clip-cyber-xs font-display font-extrabold text-[11px] tracking-[0.12em] uppercase px-[22px] py-[10px] transition-opacity duration-150 hover:opacity-85 whitespace-nowrap"
        style={{ background: 'var(--fg-inverse)', color: 'var(--primary)' }}
      >
        Shop Sale →
      </Link>
    </div>
  )
}
