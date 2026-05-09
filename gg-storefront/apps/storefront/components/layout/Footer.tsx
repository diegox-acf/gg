import Link from 'next/link'

const LINKS = {
  Shop: [
    { label: 'GPUs',        href: '/category/gpus' },
    { label: 'CPUs',        href: '/category/cpus' },
    { label: 'Peripherals', href: '/category/peripherals' },
    { label: 'Storage',     href: '/category/storage' },
    { label: 'Cases',       href: '/category/cases' },
  ],
  Account: [
    { label: 'Order History', href: '/account/orders' },
    { label: 'Sign In',       href: '/login' },
  ],
}

export function Footer() {
  return (
    <footer className="mt-24 border-t border-[var(--border)] bg-bg-surface">
      <div className="max-w-[1200px] mx-auto px-12 py-12">
        <div className="grid grid-cols-2 md:grid-cols-4 gap-8 mb-12">
          {/* Brand */}
          <div className="col-span-2">
            <div className="flex items-center gap-2 mb-4">
              <div className="clip-cyber-xs font-display font-black text-[14px] px-[10px] py-[5px] tracking-[0.12em] bg-primary text-fg-inverse">
                GG
              </div>
              <span className="font-sans font-medium text-[12px] tracking-[0.24em] uppercase text-fg-1">
                GAMING
              </span>
            </div>
            <p className="font-sans text-[13px] leading-relaxed max-w-[280px] text-fg-2">
              Gaming PC hardware for enthusiasts who demand the best. GPUs, CPUs, peripherals — everything your next build needs.
            </p>
          </div>

          {Object.entries(LINKS).map(([title, items]) => (
            <div key={title}>
              <h3 className="font-display font-bold text-[11px] tracking-[0.15em] uppercase mb-4 text-fg-3">
                {title}
              </h3>
              <ul className="flex flex-col gap-2">
                {items.map((item) => (
                  <li key={item.href}>
                    <Link
                      href={item.href}
                      className="font-sans text-[13px] text-fg-2 transition-colors duration-150 hover:text-primary"
                    >
                      {item.label}
                    </Link>
                  </li>
                ))}
              </ul>
            </div>
          ))}
        </div>

        <div className="pt-6 border-t border-[var(--border)] flex flex-col md:flex-row items-center justify-between gap-4">
          <span className="font-sans text-[12px] text-fg-3">
            © 2026 GG Gaming · gaming.gg
          </span>
          <span className="font-mono text-[11px] tracking-[0.06em] text-fg-3">
            Built to Win.
          </span>
        </div>
      </div>
    </footer>
  )
}
