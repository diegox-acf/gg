// Pattern: Container / Presenter — Server Component fetches product, passes to presenter sections.
import { notFound } from 'next/navigation'
import { Breadcrumb } from '@/components/catalog/Breadcrumb'
import { Badge } from '@/components/ui/Badge'
import { Btn } from '@/components/ui/Btn'
import { getCategoriesSafe, getProductBySlugSafe } from '@/lib/catalog-client'
import { AddToCartButton } from '@/components/catalog/AddToCartButton'

interface Props {
  params: Promise<{ slug: string }>
}

export default async function ProductPage({ params }: Props) {
  const { slug } = await params
  const [product, categories] = await Promise.all([
    getProductBySlugSafe(slug),
    getCategoriesSafe(),
  ])

  if (!product) notFound()

  const category = categories.find((c) => c.id === product.category_id)
  const price = product.price_cents / 100

  return (
    <main className="max-w-[1200px] mx-auto px-4 sm:px-8 lg:px-12 py-10">
      <Breadcrumb
        items={[
          { label: 'Home', href: '/' },
          { label: category?.label ?? product.category_id, href: `/category/${product.category_id}` },
          { label: product.name },
        ]}
      />

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-10 lg:gap-16">
        {/* Image placeholder */}
        <div className="clip-cyber aspect-square flex items-center justify-center bg-bg-elevated border border-[var(--border)]">
          <div className="clip-cyber-sm w-28 h-28 flex items-center justify-center bg-[var(--border)]">
            <svg width="40" height="40" viewBox="0 0 24 24" fill="none" stroke="var(--text-muted)" strokeWidth="1.2" strokeLinecap="round" strokeLinejoin="round">
              <rect x="2" y="3" width="20" height="14" rx="2" /><path d="M8 21h8M12 17v4" />
            </svg>
          </div>
        </div>

        {/* Details */}
        <div className="flex flex-col">
          <div className="font-display text-[11px] tracking-[0.15em] uppercase mb-2 text-primary">
            {product.brand}
          </div>
          <h1 className="font-display font-black text-[22px] sm:text-[26px] leading-tight tracking-[-0.02em] uppercase mb-3 text-fg-1">
            {product.name}
          </h1>

          <div className="flex items-center gap-3 mb-6">
            <span className="font-display font-extrabold text-[28px] tracking-[-0.02em] text-fg-1">
              ${price.toLocaleString('en-US', { minimumFractionDigits: 2 })}
            </span>
            <Badge stock={product.stock_status} />
          </div>

          {product.description && (
            <p className="font-sans text-[14px] leading-[1.7] text-fg-2 mb-6">
              {product.description}
            </p>
          )}

          <AddToCartButton product={product} />

          {/* Specs table */}
          {Object.keys(product.specs).length > 0 && (
            <div className="mt-8 border-t border-[var(--border)] pt-6">
              <div className="font-display text-[10px] tracking-[0.15em] uppercase mb-4 text-fg-3">
                Specifications
              </div>
              <dl className="grid gap-y-[1px]">
                {Object.entries(product.specs).map(([key, val]) => (
                  <div
                    key={key}
                    className="grid grid-cols-2 gap-4 py-[9px] border-b border-[var(--border)]"
                  >
                    <dt className="font-sans text-[12px] text-fg-3">{key}</dt>
                    <dd className="font-mono text-[12px] font-medium text-fg-1">{val}</dd>
                  </div>
                ))}
              </dl>
            </div>
          )}
        </div>
      </div>
    </main>
  )
}
