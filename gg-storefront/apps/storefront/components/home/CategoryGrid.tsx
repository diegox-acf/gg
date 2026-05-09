import Link from 'next/link'
import { SectionLabel } from '@/components/ui/SectionLabel'
import type { Category } from '@/lib/mock-data'

export function CategoryGrid({ categories }: { categories: Category[] }) {
  return (
    <div className="mb-[52px]">
      <SectionLabel>Shop by Category</SectionLabel>
      <div className="grid grid-cols-4 sm:grid-cols-8 gap-2">
        {categories.map((cat) => (
          <Link
            key={cat.id}
            href={`/category/${cat.id}`}
            className="clip-cyber-tr-sm flex flex-col items-center gap-2 px-3 py-[14px] text-center border bg-bg-surface border-[var(--border)] text-fg-2 transition-all duration-[180ms] ease-[cubic-bezier(0.16,1,0.3,1)] font-sans text-[12px] font-medium tracking-[0.06em] uppercase hover:bg-[var(--primary-subtle)] hover:border-primary hover:text-primary hover:shadow-[0_4px_16px_var(--primary-glow)]"
          >
            <span className="text-[18px]">{cat.icon}</span>
            {cat.label}
          </Link>
        ))}
      </div>
    </div>
  )
}
