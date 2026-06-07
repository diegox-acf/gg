import { Button, Badge, Logo } from "@gg/ui";
import type { BadgeVariant, ButtonVariant, ButtonSize } from "@gg/ui";
import { Nav } from "@/components/nav/nav";
import { ProductCard } from "@/components/product-card";
import { InputDemo } from "./input-demo";
import type { MockProduct } from "@/lib/mock-data";

// ─── helpers ─────────────────────────────────────────────────────────────────

function SectionHeader({ label }: { label: string }) {
  return (
    <div className="mb-6 flex items-center gap-3">
      <div className="h-3 w-[3px] bg-primary" />
      <h2 className="font-[family-name:var(--font-display)] text-[9px] font-bold uppercase tracking-[0.18em] text-fg-3">
        {label}
      </h2>
      <div className="h-px flex-1 bg-border" />
    </div>
  );
}

function Swatch({ token, value, label }: { token: string; value: string; label: string }) {
  return (
    <div className="flex flex-col gap-2">
      <div
        className="h-12 w-full clip-cyber-xs border border-border"
        style={{ background: value }}
      />
      <p className="font-[family-name:var(--font-mono)] text-[10px] text-fg-2">{token}</p>
      <p className="font-[family-name:var(--font-body)] text-[11px] text-fg-3">{label}</p>
    </div>
  );
}

function ClipSwatch({ label, className }: { label: string; className: string }) {
  return (
    <div className="flex flex-col items-start gap-2">
      <div
        className={`h-10 w-full bg-border-strong ${className}`}
      />
      <p className="font-[family-name:var(--font-mono)] text-[10px] text-fg-3">.{label}</p>
    </div>
  );
}

// ─── sample data ──────────────────────────────────────────────────────────────

const SAMPLE_PRODUCTS: MockProduct[] = [
  {
    id: "s1", sku: "NV-RTX4090-24G", slug: "rtx-4090",
    name: "GeForce RTX 4090 ROG Strix OC 24GB",
    brand: "ASUS ROG", description: "", categorySlug: "gpus",
    priceCents: 159999, stockStatus: "in-stock",
  },
  {
    id: "s2", sku: "AMD-R9-7950X3D", slug: "ryzen-9-7950x3d",
    name: "Ryzen 9 7950X3D 16-Core Processor",
    brand: "AMD", description: "", categorySlug: "cpus",
    priceCents: 69999, stockStatus: "low-stock",
  },
  {
    id: "s3", sku: "AMD-RX7900XTX-24G", slug: "rx-7900-xtx",
    name: "RX 7900 XTX Gaming OC 24GB",
    brand: "Gigabyte", description: "", categorySlug: "gpus",
    priceCents: 94999, stockStatus: "out-of-stock",
  },
];

const BUTTON_VARIANTS: ButtonVariant[] = ["primary", "secondary", "ghost", "danger"];
const BUTTON_SIZES: ButtonSize[] = ["sm", "md", "lg"];

const BADGE_VARIANTS: BadgeVariant[] = [
  "in-stock", "low-stock", "out-of-stock",
  "new", "sale",
  "pending", "confirmed", "failed",
  "neutral",
];

const COLOR_SWATCHES = [
  { token: "--color-page",     value: "#070a0e",             label: "Page background" },
  { token: "--color-surface",  value: "#0d1117",             label: "Card / panel" },
  { token: "--color-elevated", value: "#141b24",             label: "Input / modal" },
  { token: "--color-primary",  value: "#ff3500",             label: "Brand accent" },
  { token: "--color-border",   value: "#1e2938",             label: "Default border" },
  { token: "--color-fg-1",     value: "#f0f4f8",             label: "Primary text" },
  { token: "--color-fg-2",     value: "#8a9bb0",             label: "Muted text" },
  { token: "--color-fg-3",     value: "#4a5a6a",             label: "Subtle / placeholder" },
  { token: "--color-success",  value: "#16c77a",             label: "In Stock" },
  { token: "--color-warning",  value: "#f5a623",             label: "Low Stock" },
  { token: "--color-danger",   value: "#ef4444",             label: "Error / Out of Stock" },
  { token: "--color-info",     value: "#38bdf8",             label: "Informational" },
];

const CLIP_SWATCHES = [
  { label: "clip-cyber",       className: "clip-cyber" },
  { label: "clip-cyber-sm",    className: "clip-cyber-sm" },
  { label: "clip-cyber-xs",    className: "clip-cyber-xs" },
  { label: "clip-cyber-btn",   className: "clip-cyber-btn" },
  { label: "clip-cyber-badge", className: "clip-cyber-badge" },
  { label: "clip-cyber-input", className: "clip-cyber-input" },
  { label: "clip-logo-block",  className: "clip-logo-block" },
  { label: "clip-logo-nav",    className: "clip-logo-nav" },
];

// ─── page ────────────────────────────────────────────────────────────────────

export default function ComponentsPage() {
  return (
    <>
      <Nav />

      <main className="mx-auto max-w-[1440px] px-4 py-12 sm:px-8 lg:px-12">
        {/* Page heading */}
        <div className="mb-12">
          <p className="mb-2 font-[family-name:var(--font-display)] text-[9px] font-bold uppercase tracking-[0.2em] text-primary">
            Design System
          </p>
          <h1 className="font-[family-name:var(--font-display)] text-[32px] font-black uppercase tracking-[-0.01em] text-fg-1 sm:text-[48px]">
            Component Gallery
          </h1>
          <p className="mt-2 font-[family-name:var(--font-body)] text-[14px] text-fg-2">
            All GG Gaming UI primitives — variants, sizes, and interactive states.
          </p>
        </div>

        <div className="flex flex-col gap-16">

          {/* ── LOGO ─────────────────────────────────────────── */}
          <section>
            <SectionHeader label="Logo" />
            <div className="flex flex-col gap-6">
              {(["nav", "lg", "xl"] as const).map((size) => (
                <div key={size} className="flex items-center gap-6">
                  <Logo size={size} />
                  <span className="font-[family-name:var(--font-mono)] text-[10px] text-fg-3">
                    size=&quot;{size}&quot;
                  </span>
                </div>
              ))}
            </div>
          </section>

          {/* ── BUTTONS ──────────────────────────────────────── */}
          <section>
            <SectionHeader label="Buttons" />

            {/* Variants × sizes grid */}
            <div className="mb-8 flex flex-col gap-5">
              {BUTTON_VARIANTS.map((variant) => (
                <div key={variant} className="flex flex-wrap items-center gap-3">
                  <span className="w-20 font-[family-name:var(--font-mono)] text-[10px] text-fg-3 capitalize">
                    {variant}
                  </span>
                  {BUTTON_SIZES.map((size) => (
                    <Button key={size} variant={variant} size={size}>
                      {size === "sm" ? "Shop" : size === "md" ? "Add to Cart" : "Shop Now ↘"}
                    </Button>
                  ))}
                </div>
              ))}
            </div>

            {/* States */}
            <div className="flex flex-wrap items-center gap-3">
              <span className="w-20 font-[family-name:var(--font-mono)] text-[10px] text-fg-3">
                states
              </span>
              <Button variant="primary" loading>Add to Cart</Button>
              <Button variant="primary" disabled>Disabled</Button>
              <Button variant="secondary" disabled>Disabled</Button>
            </div>
          </section>

          {/* ── BADGES ───────────────────────────────────────── */}
          <section>
            <SectionHeader label="Badges" />

            <div className="mb-4">
              <p className="mb-3 font-[family-name:var(--font-mono)] text-[10px] text-fg-3">
                Stock status
              </p>
              <div className="flex flex-wrap gap-3">
                {(["in-stock", "low-stock", "out-of-stock"] as BadgeVariant[]).map((v) => (
                  <Badge key={v} variant={v} />
                ))}
              </div>
            </div>

            <div className="mb-4">
              <p className="mb-3 font-[family-name:var(--font-mono)] text-[10px] text-fg-3">
                Order status
              </p>
              <div className="flex flex-wrap gap-3">
                {(["pending", "confirmed", "failed"] as BadgeVariant[]).map((v) => (
                  <Badge key={v} variant={v} />
                ))}
              </div>
            </div>

            <div className="mb-4">
              <p className="mb-3 font-[family-name:var(--font-mono)] text-[10px] text-fg-3">
                Product labels
              </p>
              <div className="flex flex-wrap gap-3">
                {(["new", "sale", "neutral"] as BadgeVariant[]).map((v) => (
                  <Badge key={v} variant={v} label={v === "neutral" ? "Refurbished" : undefined} />
                ))}
              </div>
            </div>

            <div>
              <p className="mb-3 font-[family-name:var(--font-mono)] text-[10px] text-fg-3">
                All variants ({BADGE_VARIANTS.length})
              </p>
              <div className="flex flex-wrap gap-2">
                {BADGE_VARIANTS.map((v) => (
                  <Badge key={v} variant={v} label={v === "neutral" ? "Open Box" : undefined} />
                ))}
              </div>
            </div>
          </section>

          {/* ── INPUTS ───────────────────────────────────────── */}
          <section>
            <SectionHeader label="Inputs" />
            <div className="max-w-2xl">
              <InputDemo />
            </div>
          </section>

          {/* ── PRODUCT CARDS ────────────────────────────────── */}
          <section>
            <SectionHeader label="Product Cards" />
            <p className="mb-4 font-[family-name:var(--font-body)] text-[12px] text-fg-2">
              Hover each card to see HUD corners and scan sweep animation.
            </p>
            <div className="grid grid-cols-1 gap-3 sm:grid-cols-3 lg:grid-cols-3 max-w-3xl">
              {SAMPLE_PRODUCTS.map((p) => (
                <ProductCard key={p.id} product={p} />
              ))}
            </div>
          </section>

          {/* ── COLORS ───────────────────────────────────────── */}
          <section>
            <SectionHeader label="Color Tokens" />
            <div className="grid grid-cols-2 gap-4 sm:grid-cols-4 lg:grid-cols-6">
              {COLOR_SWATCHES.map((s) => (
                <Swatch key={s.token} {...s} />
              ))}
            </div>
          </section>

          {/* ── CLIP-PATH UTILITIES ──────────────────────────── */}
          <section>
            <SectionHeader label="clip-path Utilities" />
            <div className="grid grid-cols-2 gap-6 sm:grid-cols-4 lg:grid-cols-8">
              {CLIP_SWATCHES.map((s) => (
                <ClipSwatch key={s.label} {...s} />
              ))}
            </div>
          </section>

          {/* ── TYPOGRAPHY ───────────────────────────────────── */}
          <section>
            <SectionHeader label="Typography" />
            <div className="flex flex-col gap-5">
              <div>
                <p className="mb-1 font-[family-name:var(--font-mono)] text-[9px] text-fg-3">Display — Orbitron 800 56px</p>
                <p className="font-[family-name:var(--font-display)] text-[56px] font-extrabold uppercase leading-none tracking-[-0.01em] text-fg-1">
                  Max FPS.
                </p>
              </div>
              <div>
                <p className="mb-1 font-[family-name:var(--font-mono)] text-[9px] text-fg-3">H1 — Orbitron 700 40px</p>
                <h1 className="font-[family-name:var(--font-display)] text-[40px] font-bold uppercase leading-[1.1] tracking-[-0.01em] text-fg-1">
                  GeForce RTX 4090
                </h1>
              </div>
              <div>
                <p className="mb-1 font-[family-name:var(--font-mono)] text-[9px] text-fg-3">H2 — Orbitron 700 32px</p>
                <h2 className="font-[family-name:var(--font-display)] text-[32px] font-bold uppercase leading-[1.15] tracking-[-0.01em] text-fg-1">
                  Featured Products
                </h2>
              </div>
              <div>
                <p className="mb-1 font-[family-name:var(--font-mono)] text-[9px] text-fg-3">Body — Roboto 400 16px</p>
                <p className="font-[family-name:var(--font-body)] text-[16px] leading-[1.6] text-fg-1">
                  The ASUS ROG Strix GeForce RTX 4090 delivers unprecedented gaming performance with its Ada Lovelace architecture and 24GB of GDDR6X memory.
                </p>
              </div>
              <div>
                <p className="mb-1 font-[family-name:var(--font-mono)] text-[9px] text-fg-3">Body small — Roboto 400 14px muted</p>
                <p className="font-[family-name:var(--font-body)] text-[14px] leading-[1.5] text-fg-2">
                  Ships in 1–3 business days. Free returns within 30 days. Applies to items sold and fulfilled by GG Gaming.
                </p>
              </div>
              <div>
                <p className="mb-1 font-[family-name:var(--font-mono)] text-[9px] text-fg-3">Label — Orbitron 500 9px uppercase</p>
                <p className="font-[family-name:var(--font-display)] text-[9px] font-semibold uppercase tracking-[0.18em] text-fg-3">
                  Browse by category
                </p>
              </div>
              <div>
                <p className="mb-1 font-[family-name:var(--font-mono)] text-[9px] text-fg-3">Mono — Roboto Mono 400 13px</p>
                <p className="font-[family-name:var(--font-mono)] text-[13px] leading-[1.5] text-fg-2">
                  SKU: NV-RTX4090-24G — $1,599.99 — PCIe 4.0 × 16
                </p>
              </div>
              <div>
                <p className="mb-1 font-[family-name:var(--font-mono)] text-[9px] text-fg-3">Price — Orbitron 900 24px</p>
                <p className="font-[family-name:var(--font-display)] text-[24px] font-black tracking-[-0.02em] text-fg-1">
                  $1,599.99
                </p>
              </div>
            </div>
          </section>

        </div>
      </main>
    </>
  );
}
