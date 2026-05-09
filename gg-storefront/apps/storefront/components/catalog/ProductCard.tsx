'use client'
// Pattern: Optimistic UI — add-to-cart opens the drawer immediately without
// waiting for any async confirmation. State update is local and synchronous.
import Link from 'next/link'
import { Badge } from '@/components/ui/Badge'
import { useCartStore } from '@/lib/cart-store'
import type { Product } from '@/lib/mock-data'

export function ProductCard({ product }: { product: Product }) {
  // Pattern: Custom Hook — useCartStore encapsulates all cart state and actions.
  // This component doesn't need to know how the cart is stored.
  const add  = useCartStore((s) => s.add)
  const open = useCartStore((s) => s.open)

  const oos = product.stock_status === 'out-of-stock'

  function handleAddToCart(e: React.MouseEvent) {
    e.preventDefault()
    if (oos) return
    add(product)   // optimistic: updates UI immediately
    open()         // show cart drawer
  }

  return (
    <Link
      href={`/product/${product.slug}`}
      className="group clip-cyber block animate-fade-in-up overflow-hidden relative border border-[var(--border)] bg-bg-surface transition-all duration-200 ease-[cubic-bezier(0.16,1,0.3,1)] hover:-translate-y-[3px] hover:border-primary hover:shadow-[0_8px_32px_var(--primary-glow)]"
      style={{ opacity: oos ? 0.55 : 1 }}
    >
      {/* Image area */}
      <div className="h-[120px] sm:h-[130px] flex items-center justify-center relative overflow-hidden bg-bg-elevated">
        <div className="absolute top-1.5 left-1.5 w-[10px] h-[10px] opacity-60 border-t border-l border-[var(--border-bright)]" />
        <div className="absolute bottom-1.5 right-1.5 w-[10px] h-[10px] opacity-60 border-b border-r border-[var(--border-bright)]" />
        <div className="clip-cyber-sm w-16 h-16 flex items-center justify-center bg-[var(--border)]">
          <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="var(--text-muted)" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
            <rect x="2" y="3" width="20" height="14" rx="2" /><path d="M8 21h8M12 17v4" />
          </svg>
        </div>
      </div>

      {/* Content */}
      <div className="p-3 pb-[14px]">
        <div className="text-[10px] uppercase tracking-[0.1em] mb-1 font-sans font-medium text-fg-3">
          {product.brand}
        </div>
        <div className="font-sans font-semibold text-[13px] leading-snug mb-[10px] min-h-[34px] text-fg-1">
          {product.name}
        </div>
        <div className="flex items-center justify-between mb-3">
          <span className="font-display font-extrabold text-[17px] tracking-[-0.02em] text-fg-1">
            ${(product.price_cents / 100).toLocaleString('en-US', { minimumFractionDigits: 2 })}
          </span>
          <Badge stock={product.stock_status} />
        </div>
        <button
          onClick={handleAddToCart}
          className="clip-cyber-sm w-full py-[9px] font-display text-[11px] font-bold tracking-[0.1em] uppercase transition-all duration-150 border-none"
          style={{
            background: oos ? 'var(--border)' : 'var(--primary)',
            color: oos ? 'var(--text-subtle)' : 'var(--fg-inverse)',
            cursor: oos ? 'not-allowed' : 'pointer',
          }}
        >
          {oos ? 'Out of Stock' : 'Add to Cart'}
        </button>
      </div>
    </Link>
  )
}
