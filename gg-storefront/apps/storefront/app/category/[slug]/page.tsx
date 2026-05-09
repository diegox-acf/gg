// Pattern: Container / Presenter — Server Component fetches and passes data down.
import { notFound } from 'next/navigation'
import { Breadcrumb } from '@/components/catalog/Breadcrumb'
import { ProductCard } from '@/components/catalog/ProductCard'
import { SectionLabel } from '@/components/ui/SectionLabel'
import { getCategoriesSafe, getProductsSafe } from '@/lib/catalog-client'

interface Props {
  params: Promise<{ slug: string }>
}

export async function generateStaticParams() {
  const categories = await getCategoriesSafe()
  return categories.map((c) => ({ slug: c.id }))
}

export default async function CategoryPage({ params }: Props) {
  const { slug } = await params
  const [{ products }, categories] = await Promise.all([
    getProductsSafe({ categoryId: slug, pageSize: 48 }),
    getCategoriesSafe(),
  ])

  const category = categories.find((c) => c.id === slug)
  if (!category) notFound()

  return (
    <main className="max-w-[1200px] mx-auto px-4 sm:px-8 lg:px-12 py-10">
      <Breadcrumb
        items={[
          { label: 'Home', href: '/' },
          { label: category.label },
        ]}
      />

      <div className="flex items-center gap-3 mb-8">
        <span className="text-[28px]">{category.icon}</span>
        <SectionLabel>{category.label}</SectionLabel>
      </div>

      {products.length === 0 ? (
        <p className="font-sans text-[14px] text-fg-3 py-16 text-center">
          No products in this category yet.
        </p>
      ) : (
        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-4">
          {products.map((p) => (
            <ProductCard key={p.id} product={p} />
          ))}
        </div>
      )}
    </main>
  )
}
