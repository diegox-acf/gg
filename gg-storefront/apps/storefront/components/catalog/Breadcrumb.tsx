import { Fragment } from 'react'
import Link from 'next/link'

interface BreadcrumbItem {
  label: string
  href?: string
}

export function Breadcrumb({ items }: { items: BreadcrumbItem[] }) {
  return (
    <nav className="flex items-center gap-2 mb-7 font-sans text-[11px] tracking-[0.08em] uppercase">
      {items.map((item, i) => (
        <Fragment key={i}>
          {i > 0 && <span className="text-fg-3 text-[10px]">›</span>}
          {item.href ? (
            <Link href={item.href} className="text-fg-3 hover:text-primary transition-colors duration-150">
              {item.label}
            </Link>
          ) : (
            <span className="font-medium text-fg-1">{item.label}</span>
          )}
        </Fragment>
      ))}
    </nav>
  )
}
