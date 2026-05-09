// Pattern: Container / Presenter — this Server Component owns data fetching;
// Hero, CategoryGrid, FeaturedProducts are pure presenter components.
import { Hero } from '@/components/home/Hero'
import { CategoryGrid } from '@/components/home/CategoryGrid'
import { PromoBanner } from '@/components/home/PromoBanner'
import { FeaturedProducts } from '@/components/home/FeaturedProducts'
import { getCategoriesSafe, getProductsSafe } from '@/lib/catalog-client'

export default async function HomePage() {
  const [{ products }, categories] = await Promise.all([
    getProductsSafe({ pageSize: 8 }),
    getCategoriesSafe(),
  ])

  return (
    <>
      <Hero featuredDrop={products.slice(0, 3)} />
      <div className="max-w-[1200px] mx-auto px-12 py-12">
        <CategoryGrid categories={categories} />
        <PromoBanner />
        <FeaturedProducts products={products} />
      </div>
    </>
  )
}
