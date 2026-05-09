'use client'
// Pattern: Container split — Navbar is a Client Component only because it needs
// interactivity (cart count, mobile menu). Static nav links could be a Server
// Component; extracted here as NavLink to keep the split visible.
import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { ShoppingCart, User, Menu, X } from 'lucide-react'
import { useState } from 'react'
import { cn } from '@gg/ui'
import { Logo } from '@/components/ui/Logo'
import { useCartStore } from '@/lib/cart-store'

const NAV_ITEMS = [
  { label: 'GPUs',        href: '/category/gpus' },
  { label: 'CPUs',        href: '/category/cpus' },
  { label: 'Peripherals', href: '/category/peripherals' },
  { label: 'Storage',     href: '/category/storage' },
  { label: 'Cases',       href: '/category/cases' },
]

// Pattern: Presenter sub-component — NavLink is a pure renderer that derives
// its active state from the router; no external state needed.
function NavLink({ href, children }: { href: string; children: React.ReactNode }) {
  const pathname = usePathname()
  const active = pathname === href

  return (
    <Link
      href={href}
      className={cn(
        'group relative flex flex-col gap-[2px] font-sans font-medium text-[12px] tracking-[0.1em] uppercase transition-colors duration-150 hover:text-primary',
        active ? 'text-primary' : 'text-fg-2',
      )}
    >
      {children}
      <span
        className={cn(
          'h-px bg-primary origin-left transition-transform duration-200 ease-[cubic-bezier(0.16,1,0.3,1)] group-hover:scale-x-100',
          active ? 'scale-x-100' : 'scale-x-0',
        )}
      />
    </Link>
  )
}

export function Navbar() {
  const [menuOpen, setMenuOpen] = useState(false)

  // Pattern: Selector subscription — subscribe only to the slice of store state
  // this component needs, avoiding re-renders on unrelated cart changes.
  const open       = useCartStore((s) => s.open)
  const totalCount = useCartStore((s) => s.totalCount)
  const count = totalCount()

  return (
    <nav
      className="sticky top-0 z-50 flex items-center h-[60px] px-4 sm:px-8 border-b border-[var(--border)]"
      style={{
        background: 'color-mix(in srgb, var(--bg) 92%, transparent)',
        backdropFilter: 'blur(14px)',
        WebkitBackdropFilter: 'blur(14px)',
      }}
    >
      <Logo />

      {/* Desktop nav — hidden on mobile */}
      <div className="flex-1 hidden md:flex justify-center gap-6 lg:gap-8">
        {NAV_ITEMS.map((item) => (
          <NavLink key={item.href} href={item.href}>
            {item.label}
          </NavLink>
        ))}
      </div>

      {/* Actions */}
      <div className="flex items-center gap-1 ml-auto">
        <Link
          href="/account/orders"
          className="clip-cyber-xs flex items-center p-2 text-fg-2 transition-all duration-150 hover:bg-[var(--primary-subtle)] hover:text-primary"
        >
          <User size={17} strokeWidth={1.75} />
        </Link>

        <button
          onClick={open}
          className="clip-cyber-xs relative flex items-center p-2 bg-transparent border-none cursor-pointer text-fg-2 transition-all duration-150 hover:bg-[var(--primary-subtle)] hover:text-primary"
        >
          <ShoppingCart size={17} strokeWidth={1.75} />
          {count > 0 && (
            <span className="absolute top-0.5 right-0.5 w-4 h-4 rounded-full flex items-center justify-center font-display font-black text-[9px] bg-primary text-fg-inverse">
              {count > 9 ? '9+' : count}
            </span>
          )}
        </button>

        {/* Mobile hamburger */}
        <button
          className="md:hidden flex items-center p-2 bg-transparent border-none cursor-pointer text-fg-1 transition-colors duration-150"
          onClick={() => setMenuOpen(!menuOpen)}
          aria-label={menuOpen ? 'Close menu' : 'Open menu'}
        >
          {menuOpen ? <X size={20} strokeWidth={2} /> : <Menu size={20} strokeWidth={2} />}
        </button>
      </div>

      {/* Mobile menu dropdown */}
      {menuOpen && (
        <div className="absolute top-[60px] left-0 right-0 flex flex-col bg-bg-surface border-b border-[var(--border)] md:hidden z-50">
          {NAV_ITEMS.map((item) => (
            <Link
              key={item.href}
              href={item.href}
              onClick={() => setMenuOpen(false)}
              className="px-6 py-[10px] font-sans text-[14px] font-medium uppercase tracking-[0.06em] border-b border-[var(--border)] text-fg-1 transition-colors duration-150 hover:text-primary hover:bg-[var(--primary-subtle)]"
            >
              {item.label}
            </Link>
          ))}
        </div>
      )}
    </nav>
  )
}
