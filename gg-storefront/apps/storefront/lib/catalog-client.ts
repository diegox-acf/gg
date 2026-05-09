import type { Product, Category } from './mock-data'
import { PRODUCTS, CATEGORIES } from './mock-data'

const CATALOG_URL = process.env.CATALOG_API_URL ?? 'http://localhost:8080'

async function fetchCatalog<T>(path: string, revalidate = 60): Promise<T> {
  const res = await fetch(`${CATALOG_URL}${path}`, {
    next: { revalidate },
  })
  if (!res.ok) throw new Error(`catalog ${path}: ${res.status}`)
  return res.json()
}

export async function getProducts(params?: {
  categoryId?: string
  pageSize?: number
  pageToken?: string
}): Promise<{ products: Product[]; nextPageToken: string }> {
  const url = new URL(`${CATALOG_URL}/v1/products`)
  if (params?.categoryId) url.searchParams.set('category_id', params.categoryId)
  if (params?.pageSize)   url.searchParams.set('page_size',   String(params.pageSize))
  if (params?.pageToken)  url.searchParams.set('page_token',  params.pageToken)

  const res = await fetch(url.toString(), { next: { revalidate: 60 } })
  if (!res.ok) throw new Error(`catalog /v1/products: ${res.status}`)

  const data = await res.json()
  return { products: data.products ?? [], nextPageToken: data.next_page_token ?? '' }
}

export async function getProductBySlug(slug: string): Promise<Product | null> {
  const data = await fetchCatalog<{ product: Product }>(
    `/v1/products/slug/${encodeURIComponent(slug)}`,
    300,
  ).catch(() => null)
  return data?.product ?? null
}

export async function getCategories(): Promise<Category[]> {
  const data = await fetchCatalog<{ categories: Category[] }>('/v1/categories', 300)
  return data.categories ?? []
}

// Fallback variants used during local dev when catalog is not running.
export async function getProductsSafe(params?: Parameters<typeof getProducts>[0]) {
  return getProducts(params).catch(() => ({
    products: params?.categoryId
      ? PRODUCTS.filter((p) => p.category_id === params.categoryId)
      : PRODUCTS,
    nextPageToken: '',
  }))
}

export async function getProductBySlugSafe(slug: string) {
  return getProductBySlug(slug).catch(() =>
    PRODUCTS.find((p) => p.slug === slug) ?? null,
  )
}

export async function getCategoriesSafe() {
  return getCategories().catch(() => CATEGORIES)
}
