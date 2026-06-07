"use client";

import { useEffect, useRef, useState } from "react";
import Link from "next/link";
import { ArrowDownRight, ArrowRight, Cpu } from "lucide-react";
import { buttonVariants } from "@gg/ui";
import { formatPrice, type MockProduct } from "@/lib/mock-data";

const STATS: [string, string][] = [
  ["200+", "Products"],
  ["8", "Categories"],
  ["1–3d", "Ships Fast"],
];

export function HomeHero({ drops }: { drops: MockProduct[] }) {
  const ref = useRef<HTMLElement>(null);
  const reduceMotion = useRef(false);
  const [parallax, setParallax] = useState({ x: 0, y: 0 });

  useEffect(() => {
    reduceMotion.current = window.matchMedia(
      "(prefers-reduced-motion: reduce)",
    ).matches;
  }, []);

  function onMove(e: React.MouseEvent) {
    if (reduceMotion.current || !ref.current) return;
    const r = ref.current.getBoundingClientRect();
    setParallax({
      x: ((e.clientX - r.left) / r.width - 0.5) * 2,
      y: ((e.clientY - r.top) / r.height - 0.5) * 2,
    });
  }

  return (
    <section
      ref={ref}
      onMouseMove={onMove}
      onMouseLeave={() => setParallax({ x: 0, y: 0 })}
      className="relative overflow-hidden border-b border-border px-4 py-16 sm:px-8 sm:py-20 lg:px-12"
    >
      {/* ── Background layers ── */}
      {/* Accent glow blob (parallax) */}
      <div
        aria-hidden="true"
        className="pointer-events-none absolute -right-32 -top-24 z-0 size-[560px] rounded-full opacity-[0.22] blur-[100px]"
        style={{
          background:
            "radial-gradient(circle, var(--color-primary) 0%, transparent 70%)",
          transform: `translate3d(${parallax.x * 18}px, ${parallax.y * 12}px, 0)`,
          transition: "transform 500ms cubic-bezier(0.16,1,0.3,1)",
        }}
      />
      {/* Left-to-transparent wash to seat the copy */}
      <div
        aria-hidden="true"
        className="pointer-events-none absolute inset-0 z-0"
        style={{
          background:
            "linear-gradient(90deg, var(--bg) 0%, color-mix(in srgb, var(--bg) 80%, transparent) 40%, color-mix(in srgb, var(--bg) 25%, transparent) 78%, transparent 100%)",
        }}
      />
      {/* Vignette */}
      <div
        aria-hidden="true"
        className="pointer-events-none absolute inset-0 z-0"
        style={{
          background:
            "radial-gradient(ellipse at center, transparent 35%, rgba(0,0,0,0.45) 100%)",
        }}
      />
      {/* Skewed accent strip, right edge */}
      <div
        aria-hidden="true"
        className="pointer-events-none absolute -right-16 bottom-0 top-0 z-0 hidden w-32 bg-primary-muted [transform:skewX(-8deg)] lg:block"
      />
      {/* Animated horizontal scan line */}
      <div
        aria-hidden="true"
        className="pointer-events-none absolute inset-x-0 top-0 z-[1] h-full overflow-hidden"
      >
        <div
          className="absolute inset-x-0 h-0.5 opacity-40 motion-reduce:hidden"
          style={{
            background:
              "linear-gradient(90deg, transparent 0%, var(--color-primary) 20%, var(--color-primary) 80%, transparent 100%)",
            animation: "heroScan 6s ease-in-out infinite",
          }}
        />
      </div>

      {/* ── Content ── */}
      <div className="relative z-[2] mx-auto grid max-w-[1280px] items-center gap-12 lg:grid-cols-[1fr_auto]">
        {/* Left column */}
        <div>
          <div className="mb-5 flex items-center gap-3">
            <span className="h-px w-6 bg-primary" />
            <span className="font-[family-name:var(--font-display)] text-[10px] font-semibold uppercase tracking-[0.2em] text-primary">
              Gaming Hardware / Est. 2026
            </span>
          </div>

          <h1 className="hero-glitch font-[family-name:var(--font-display)] text-[clamp(40px,7vw,84px)] font-black uppercase leading-[0.95] tracking-[-0.02em] text-fg-1">
            Max FPS.
            <br />
            <span
              className="inline-block text-primary"
              style={{
                textShadow:
                  "0 0 28px color-mix(in srgb, var(--color-primary) 45%, transparent)",
              }}
            >
              Zero
            </span>
            <br />
            Compromise.
          </h1>

          <p className="mt-5 max-w-[440px] font-[family-name:var(--font-body)] text-[15px] leading-[1.7] text-fg-2">
            Gaming PC hardware for enthusiasts who demand the best. GPUs, CPUs,
            peripherals — everything your next build needs.
          </p>

          {/* CTAs */}
          <div className="mt-9 flex flex-wrap items-end gap-4">
            <Link
              href="/category/gpus"
              aria-label="Shop now"
              className="group flex h-[88px] w-[100px] flex-col justify-between bg-primary p-4 text-fg-inverse transition-all duration-200 ease-[cubic-bezier(0.16,1,0.3,1)] hover:-translate-y-0.5 hover:bg-primary-hover hover:shadow-[0_8px_32px_var(--color-primary-muted)]"
              style={{
                clipPath:
                  "polygon(0 0, 100% 0, 100% calc(100% - 12px), calc(100% - 12px) 100%, 0 100%)",
              }}
            >
              <span className="font-[family-name:var(--font-display)] text-[13px] font-black uppercase leading-[1.1] tracking-[0.04em]">
                Shop
                <br />
                Now
              </span>
              <ArrowDownRight
                size={20}
                className="self-end transition-transform duration-200 group-hover:translate-x-0.5 group-hover:translate-y-0.5"
              />
            </Link>

            <Link
              href="/category/cpus"
              className={buttonVariants({ variant: "secondary", size: "lg" })}
            >
              Explore CPUs
              <ArrowRight size={14} />
            </Link>
          </div>

          {/* Stats */}
          <div className="mt-10 flex flex-wrap gap-8 border-t border-border pt-6">
            {STATS.map(([value, label]) => (
              <div key={label}>
                <div className="font-[family-name:var(--font-display)] text-[20px] font-extrabold tracking-[-0.02em] text-primary">
                  {value}
                </div>
                <div className="mt-0.5 font-[family-name:var(--font-body)] text-[11px] uppercase tracking-[0.1em] text-fg-3">
                  {label}
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Right deco column — desktop only */}
        <div className="hidden w-[260px] flex-col gap-3 lg:flex">
          {/* Featured rig panel (image-free placeholder) */}
          <div
            className="relative h-[180px] w-full overflow-hidden border border-primary bg-elevated"
            style={{
              clipPath:
                "polygon(0 0, calc(100% - 18px) 0, 100% 18px, 100% 100%, 0 100%)",
              boxShadow:
                "0 12px 40px rgba(0,0,0,0.6), 0 0 28px var(--color-primary-muted)",
            }}
          >
            {/* grid texture */}
            <div
              aria-hidden="true"
              className="absolute inset-0 opacity-50"
              style={{
                backgroundImage:
                  "linear-gradient(var(--grid-line) 1px, transparent 1px), linear-gradient(90deg, var(--grid-line) 1px, transparent 1px)",
                backgroundSize: "24px 24px",
              }}
            />
            {/* scanlines */}
            <div
              aria-hidden="true"
              className="absolute inset-0 opacity-60"
              style={{
                backgroundImage:
                  "repeating-linear-gradient(0deg, transparent 0, transparent 2px, rgba(0,0,0,0.2) 2px, rgba(0,0,0,0.2) 3px)",
              }}
            />
            <Cpu
              size={56}
              className="absolute inset-0 m-auto text-primary opacity-80"
              strokeWidth={1.25}
            />
            {/* HUD corners */}
            <span className="absolute left-2.5 top-2.5 size-3.5 border-l-[1.5px] border-t-[1.5px] border-primary" />
            <span className="absolute bottom-2.5 right-2.5 size-3.5 border-b-[1.5px] border-r-[1.5px] border-primary" />
            <span className="absolute bottom-2.5 left-2.5 font-[family-name:var(--font-display)] text-[9px] uppercase tracking-[0.2em] text-primary">
              ▼ Featured Rig
            </span>
            <span className="absolute right-2.5 top-2 font-[family-name:var(--font-mono)] text-[9px] text-fg-1 opacity-80">
              REC ●
            </span>
          </div>

          {/* Featured drop list */}
          <div
            className="border border-border-strong p-[14px] backdrop-blur-[8px]"
            style={{
              background: "color-mix(in srgb, var(--surface) 88%, transparent)",
              clipPath:
                "polygon(0 0, calc(100% - 16px) 0, 100% 16px, 100% 100%, 0 100%)",
            }}
          >
            <p className="mb-2.5 font-[family-name:var(--font-display)] text-[9px] uppercase tracking-[0.15em] text-primary">
              Featured Drop
            </p>
            {drops.map((p) => (
              <Link
                key={p.id}
                href={`/product/${p.slug}`}
                className="group flex items-center justify-between gap-2 border-b border-border py-[7px] last:border-b-0"
              >
                <span className="line-clamp-1 flex-1 font-[family-name:var(--font-body)] text-[11px] text-fg-2 transition-colors group-hover:text-primary">
                  {p.name}
                </span>
                <span className="whitespace-nowrap font-[family-name:var(--font-display)] text-[11px] font-bold text-fg-1">
                  {formatPrice(p.priceCents)}
                </span>
              </Link>
            ))}
          </div>
        </div>
      </div>
    </section>
  );
}
