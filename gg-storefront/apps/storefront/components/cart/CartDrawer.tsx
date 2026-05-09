'use client'
// Pattern: Observer / Subscriber — CartDrawer subscribes to the Zustand store
// and re-renders only when cart state changes. The store is the single source
// of truth; this component never owns cart data directly.
import Link from 'next/link'
import { X, ShoppingCart, Trash2 } from 'lucide-react'
import { useCartStore } from '@/lib/cart-store'
import { Btn } from '@/components/ui/Btn'

const SHIPPING = 9.99
const TAX_RATE  = 0.08

export function CartDrawer() {
  // Pattern: Selector subscription — each selector is a separate subscription
  // so unrelated state changes don't trigger unnecessary re-renders.
  const items    = useCartStore((s) => s.items)
  const isOpen   = useCartStore((s) => s.isOpen)
  const close    = useCartStore((s) => s.close)
  const update   = useCartStore((s) => s.update)
  const remove   = useCartStore((s) => s.remove)
  const subtotal = useCartStore((s) => s.subtotal())

  const tax   = subtotal * TAX_RATE
  const total = subtotal + SHIPPING + tax

  if (!isOpen) return null

  return (
    <>
      {/* Backdrop */}
      <div
        className="fixed inset-0 z-[200]"
        style={{ background: 'rgba(7,7,7,0.82)', backdropFilter: 'blur(6px)', WebkitBackdropFilter: 'blur(6px)' }}
        onClick={close}
      />

      {/* Drawer — full-width on mobile, 420px on sm+ */}
      <div
        className="fixed right-0 top-0 h-screen w-full sm:w-[420px] z-[201] flex flex-col"
        style={{
          background: 'var(--surface)',
          borderLeft: '1px solid var(--border)',
          boxShadow: '-8px 0 48px rgba(0,0,0,0.9)',
        }}
      >
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-[18px] border-b border-[var(--border)]">
          <div className="flex items-center gap-[10px]">
            <div className="w-[3px] h-[18px] bg-primary" />
            <span className="font-display font-bold text-[14px] tracking-[0.1em] uppercase text-fg-1">
              Your Cart
            </span>
          </div>
          <button
            onClick={close}
            className="flex items-center p-1.5 bg-transparent border-none cursor-pointer text-fg-2 transition-colors duration-150 hover:text-primary"
            aria-label="Close cart"
          >
            <X size={18} strokeWidth={2} />
          </button>
        </div>

        {/* Items list */}
        <div className="flex-1 overflow-y-auto px-6 py-4">
          {items.length === 0 ? (
            // Pattern: Empty State — always provide a clear empty state with
            // a recovery action rather than leaving the user with a blank UI.
            <div className="flex flex-col items-center justify-center py-16 text-center">
              <ShoppingCart size={40} strokeWidth={1.25} className="mb-4 opacity-30 text-fg-3" />
              <p className="font-sans text-[13px] mb-6 text-fg-2">
                Your cart is empty — browse categories to get started.
              </p>
              <Btn variant="secondary" size="sm" onClick={close}>
                Browse Categories
              </Btn>
            </div>
          ) : (
            items.map(({ product, qty }) => (
              <div key={product.id} className="flex gap-3 py-[14px] border-b border-[var(--border)]">
                {/* Thumb */}
                <div className="clip-cyber-xs w-14 h-14 shrink-0 flex items-center justify-center border border-[var(--border)] bg-bg-elevated">
                  <div className="w-7 h-7 bg-[var(--border)]" />
                </div>

                {/* Info */}
                <div className="flex-1 min-w-0">
                  <div className="font-display text-[9px] tracking-[0.1em] uppercase mb-1 text-fg-3">
                    {product.brand}
                  </div>
                  <div className="font-sans font-medium text-[12px] leading-snug mb-2 text-fg-1">
                    {product.name}
                  </div>
                  <div className="flex items-center justify-between">
                    {/* Qty stepper */}
                    <div className="flex items-center border border-[var(--border)]">
                      <button
                        onClick={() => update(product.id, qty - 1)}
                        className="w-[26px] h-6 flex items-center justify-center font-sans text-[14px] bg-transparent border-none cursor-pointer text-fg-2 transition-colors duration-150 hover:text-primary"
                      >−</button>
                      <span className="w-[26px] text-center font-display text-[11px] font-bold text-fg-1">{qty}</span>
                      <button
                        onClick={() => update(product.id, qty + 1)}
                        className="w-[26px] h-6 flex items-center justify-center font-sans text-[14px] bg-transparent border-none cursor-pointer text-fg-2 transition-colors duration-150 hover:text-primary"
                      >+</button>
                    </div>

                    <span className="font-display font-extrabold text-[14px] text-fg-1">
                      ${((product.price_cents / 100) * qty).toFixed(2)}
                    </span>

                    <button
                      onClick={() => remove(product.id)}
                      className="flex items-center p-1 bg-transparent border-none cursor-pointer text-fg-3 transition-colors duration-150 hover:text-danger"
                      aria-label={`Remove ${product.name}`}
                    >
                      <Trash2 size={14} strokeWidth={2} />
                    </button>
                  </div>
                </div>
              </div>
            ))
          )}
        </div>

        {/* Footer — only shown when cart has items */}
        {items.length > 0 && (
          <div className="px-6 py-[18px] border-t border-[var(--border)]">
            {[
              ['Subtotal', `$${subtotal.toFixed(2)}`],
              ['Shipping', '$9.99'],
              [`Tax (${TAX_RATE * 100}%)`, `$${tax.toFixed(2)}`],
            ].map(([label, value]) => (
              <div key={label} className="flex justify-between mb-2 font-sans text-[13px] text-fg-2">
                <span>{label}</span>
                <span className="text-fg-1">{value}</span>
              </div>
            ))}

            <div className="flex justify-between pt-3 border-t border-[var(--border)] mb-4 font-display font-extrabold text-[17px]">
              <span className="text-fg-1">Total</span>
              <span className="text-primary">${total.toFixed(2)}</span>
            </div>

            <Link href="/checkout" onClick={close} className="block">
              <Btn size="lg" className="w-full justify-center">
                Proceed to Checkout →
              </Btn>
            </Link>
            <button
              onClick={close}
              className="w-full mt-2 py-2 font-sans text-[12px] tracking-[0.06em] bg-transparent border-none cursor-pointer text-fg-2 transition-colors duration-150 hover:text-fg-1"
            >
              Continue Shopping
            </button>
          </div>
        )}
      </div>
    </>
  )
}
