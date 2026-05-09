// Pattern: Presenter component — receives data as props, no data fetching.
// The parent (page.tsx Server Component) owns the data; Hero only renders.
import Link from 'next/link'
import type { Product } from '@/lib/mock-data'

interface HeroProps {
  featuredDrop: Product[]
}

export function Hero({ featuredDrop }: HeroProps) {
  return (
    <section
      className="relative overflow-hidden px-4 sm:px-8 lg:px-12 pt-12 sm:pt-16 lg:pt-20 pb-12 sm:pb-[72px] border-b border-[var(--border)]"
    >
      {/* Scan line animation */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none z-[1]">
        <div
          className="absolute left-0 right-0 h-0.5 opacity-[0.35]"
          style={{
            background: 'linear-gradient(90deg, transparent 0%, var(--primary) 20%, var(--primary) 80%, transparent 100%)',
            animation: 'heroScan 6s ease-in-out infinite',
          }}
        />
      </div>

      {/* Decorative backgrounds */}
      <div
        className="absolute inset-0 pointer-events-none z-0"
        style={{ background: 'radial-gradient(ellipse at 80% 50%, var(--primary-subtle) 0%, transparent 60%)' }}
      />
      <div
        className="absolute right-[-60px] top-0 bottom-0 w-[120px] pointer-events-none z-0 hidden lg:block"
        style={{ background: 'var(--primary-subtle)', transform: 'skewX(-8deg)' }}
      />

      <div className="max-w-[1200px] mx-auto relative z-[2]">
        {/* Stack on mobile, side-by-side on lg+ */}
        <div className="flex flex-col lg:grid lg:grid-cols-[1fr_auto] lg:gap-12 lg:items-center">
          <div>
            {/* Eyebrow */}
            <div className="flex items-center gap-3 mb-4 sm:mb-5">
              <div className="w-6 h-px bg-primary" />
              <span className="font-display text-[10px] font-semibold tracking-[0.2em] uppercase text-primary">
                Gaming Hardware / Est. 2026
              </span>
            </div>

            <h1
              className="font-display font-black leading-[0.95] uppercase tracking-[-0.02em] mb-4 text-fg-1"
              style={{ fontSize: 'clamp(36px, 7vw, 88px)' }}
            >
              MAX FPS.<br />
              <span className="text-primary inline-block">ZERO</span><br />
              COMPROMISE.
            </h1>

            <p className="font-sans text-[14px] sm:text-[15px] leading-[1.7] mb-8 sm:mb-9 max-w-[440px] text-fg-2">
              Gaming PC hardware for enthusiasts who demand the best. GPUs, CPUs,
              peripherals — everything your next build needs.
            </p>

            <div className="flex items-end gap-3 sm:gap-4 flex-wrap">
              {/* Primary CTA */}
              <Link
                href="/category/gpus"
                className="clip-cyber-tr inline-flex flex-col justify-between items-start w-[90px] h-[80px] sm:w-[100px] sm:h-[88px] p-[12px_14px] sm:p-[14px_16px] bg-primary text-fg-inverse transition-all duration-200 ease-[cubic-bezier(0.16,1,0.3,1)] hover:-translate-y-0.5 hover:bg-[#e8ff1a] hover:shadow-[0_8px_32px_var(--primary-glow)]"
              >
                <span className="font-display font-black text-[12px] sm:text-[13px] leading-[1.1] tracking-[0.04em] uppercase">
                  SHOP<br />NOW
                </span>
                <span className="self-end text-[18px] sm:text-[20px] leading-none">↘</span>
              </Link>

              {/* Secondary CTA */}
              <Link
                href="/category/cpus"
                className="clip-cyber-btn inline-flex items-center gap-2 px-5 sm:px-7 py-[11px] sm:py-[14px] font-display font-bold text-[12px] sm:text-[13px] tracking-[0.1em] uppercase border bg-transparent border-[var(--border-bright)] text-fg-1 transition-all duration-[180ms] hover:-translate-y-px hover:bg-[var(--primary-subtle)] hover:border-primary hover:text-primary"
              >
                Explore CPUs
                <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round">
                  <path d="M5 12h14M12 5l7 7-7 7" />
                </svg>
              </Link>
            </div>

            {/* Stats row */}
            <div className="flex gap-6 sm:gap-8 mt-8 sm:mt-10 pt-5 sm:pt-6 border-t border-[var(--border)]">
              {[['200+', 'Products'], ['8', 'Categories'], ['1–3d', 'Ships Fast']].map(([n, l]) => (
                <div key={l}>
                  <div className="font-display font-extrabold text-[18px] sm:text-[20px] tracking-[-0.02em] text-primary">{n}</div>
                  <div className="font-sans text-[10px] sm:text-[11px] uppercase tracking-[0.1em] mt-0.5 text-fg-2">{l}</div>
                </div>
              ))}
            </div>
          </div>

          {/* Featured drop HUD — hidden on mobile/tablet, visible lg+ */}
          <div className="hidden lg:flex flex-col gap-3 items-end mt-0">
            <div
              className="clip-cyber-tr w-[200px] p-[18px_20px] border border-[var(--border)]"
              style={{ background: 'var(--surface)' }}
            >
              <div className="font-display text-[9px] tracking-[0.15em] uppercase mb-[10px] text-primary">
                Featured Drop
              </div>
              {featuredDrop.map((p) => (
                <Link
                  key={p.id}
                  href={`/product/${p.slug}`}
                  className="flex justify-between items-center py-[7px] border-b border-[var(--border)] text-fg-2 transition-colors duration-150 hover:text-primary"
                >
                  <span className="font-sans text-[11px] flex-1 pr-2 leading-snug">
                    {p.name.substring(0, 22)}…
                  </span>
                  <span className="font-display text-[11px] font-bold whitespace-nowrap text-fg-1">
                    ${(p.price_cents / 100).toFixed(0)}
                  </span>
                </Link>
              ))}
            </div>
            <div
              className="w-[200px] h-9 opacity-[0.12]"
              style={{
                backgroundImage:
                  'repeating-linear-gradient(90deg, var(--text) 0, var(--text) 2px, transparent 2px, transparent 5px, var(--text) 5px, var(--text) 7px, transparent 7px, transparent 12px)',
              }}
            />
          </div>
        </div>
      </div>
    </section>
  )
}
