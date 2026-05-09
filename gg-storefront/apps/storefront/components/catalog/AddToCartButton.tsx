'use client'
// Pattern: Optimistic UI — cart updates immediately on click, no async wait.
import { useCartStore } from '@/lib/cart-store'
import { Btn } from '@/components/ui/Btn'
import type { Product } from '@/lib/mock-data'

export function AddToCartButton({ product }: { product: Product }) {
  const add  = useCartStore((s) => s.add)
  const open = useCartStore((s) => s.open)
  const oos  = product.stock_status === 'out-of-stock'

  function handleClick() {
    if (oos) return
    add(product)
    open()
  }

  return (
    <Btn
      size="lg"
      disabled={oos}
      onClick={handleClick}
      className="w-full sm:w-auto justify-center"
    >
      {oos ? 'Out of Stock' : 'Add to Cart'}
    </Btn>
  )
}
