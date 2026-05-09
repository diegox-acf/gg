import Link from 'next/link'
import { SectionLabel } from '@/components/ui/SectionLabel'
import { ProductCard } from '@/components/catalog/ProductCard'
import type { Product } from '@/lib/mock-data'

export function FeaturedProducts({ products }: { products: Product[] }) {
  return (
    <div>
      <div className="flex items-center justify-between mb-5">
        <SectionLabel>Featured Products</SectionLabel>
        <Link
          href="/category/gpus"
          className="flex items-center gap-1 font-sans text-[12px] uppercase tracking-[0.06em] text-fg-2 transition-colors duration-150 hover:text-primary"
        >
          View all
          <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round">
            <path d="M5 12h14M12 5l7 7-7 7" />
          </svg>
        </Link>
      </div>
      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-4">
        {products.map((p) => (
          <ProductCard key={p.id} product={p} />
        ))}
      </div>
    </div>
  )
}
