import Link from "next/link";
import { ArrowRight } from "lucide-react";
import { Nav } from "@/components/nav/nav";
import { HomeHero } from "@/components/home/home-hero";
import { ProductCard } from "@/components/product-card";
import { getCategories, getProducts } from "@/lib/catalog/data";

// Per-request rendering so the page reflects live Catalog data.
export const dynamic = "force-dynamic";

function SectionHeader({
  title,
  action,
}: {
  title: string;
  action?: { href: string; label: string };
}) {
  return (
    <div className="mb-6 flex items-center justify-between">
      <div className="flex items-center gap-3">
        <span className="h-5 w-[3px] bg-primary" />
        <h2 className="font-[family-name:var(--font-display)] text-[15px] font-bold uppercase tracking-[0.08em] text-fg-1 sm:text-[16px]">
          {title}
        </h2>
      </div>
      {action && (
        <Link
          href={action.href}
          className="flex items-center gap-1.5 font-[family-name:var(--font-body)] text-[12px] uppercase tracking-[0.06em] text-fg-3 transition-colors hover:text-primary"
        >
          {action.label}
          <ArrowRight size={13} />
        </Link>
      )}
    </div>
  );
}

export default async function HomePage() {
  const [categories, products] = await Promise.all([
    getCategories(),
    getProducts({ pageSize: 8 }),
  ]);

  return (
    <>
      <Nav />
      <HomeHero drops={products.slice(0, 3)} />

      <main className="mx-auto max-w-[1280px] px-4 py-12 sm:px-8 lg:px-12">
        {/* Categories */}
        <section className="mb-14">
          <SectionHeader title="Shop by Category" />
          <div className="grid grid-cols-2 gap-2 sm:grid-cols-4 lg:grid-cols-8">
            {categories.map((cat) => (
              <Link
                key={cat.slug}
                href={`/category/${cat.slug}`}
                className="group clip-cyber-xs flex flex-col items-center gap-2 border border-border bg-surface px-3 py-4 text-center transition-all duration-150 hover:border-primary hover:bg-primary-muted hover:shadow-[0_4px_16px_var(--color-primary-muted)]"
              >
                <span className="text-[18px] leading-none text-fg-2 transition-colors group-hover:text-primary">
                  {cat.icon}
                </span>
                <span className="font-[family-name:var(--font-body)] text-[12px] font-medium uppercase tracking-[0.06em] text-fg-2 transition-colors group-hover:text-primary">
                  {cat.name}
                </span>
              </Link>
            ))}
          </div>
        </section>

        {/* Promo banner */}
        <section
          className="mb-14 flex flex-wrap items-center justify-between gap-4 bg-primary px-7 py-5"
          style={{
            clipPath:
              "polygon(0 0, calc(100% - 20px) 0, 100% 20px, 100% 100%, 20px 100%, 0 calc(100% - 20px))",
          }}
        >
          <div>
            <p className="mb-1 font-[family-name:var(--font-display)] text-[10px] font-semibold uppercase tracking-[0.18em] text-fg-inverse opacity-70">
              Flash Sale — Ends Tonight
            </p>
            <p className="font-[family-name:var(--font-display)] text-[16px] font-extrabold tracking-[0.02em] text-fg-inverse sm:text-[17px]">
              Up to 15% off select GPUs &amp; peripherals
            </p>
          </div>
          <Link
            href="/category/gpus"
            className="clip-cyber-xs whitespace-nowrap bg-fg-inverse px-5 py-2.5 font-[family-name:var(--font-display)] text-[11px] font-extrabold uppercase tracking-[0.12em] text-primary transition-opacity duration-150 hover:opacity-85"
          >
            Shop Sale →
          </Link>
        </section>

        {/* Featured products */}
        <section>
          <SectionHeader
            title="Featured Products"
            action={{ href: "/category/gpus", label: "View all" }}
          />
          <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-4">
            {products.map((product, i) => (
              <ProductCard key={product.id} product={product} priority={i < 4} />
            ))}
          </div>
        </section>
      </main>
    </>
  );
}
