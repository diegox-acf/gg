import Link from "next/link";
import type { Metadata } from "next";
import { ChevronRight } from "lucide-react";
import { Nav } from "@/components/nav/nav";
import { CheckoutFlow } from "@/components/checkout/checkout-flow";

export const metadata: Metadata = {
  title: "Checkout — GG Gaming",
};

export default function CheckoutPage() {
  return (
    <>
      <Nav />

      <main className="mx-auto max-w-[1100px] px-4 py-10 sm:px-8 lg:px-12">
        {/* Breadcrumb */}
        <nav
          aria-label="Breadcrumb"
          className="mb-7 flex items-center gap-1.5 font-[family-name:var(--font-body)] text-[11px] uppercase tracking-[0.08em] text-fg-3"
        >
          <Link href="/" className="transition-colors hover:text-fg-1">
            Home
          </Link>
          <ChevronRight size={12} aria-hidden="true" />
          <span className="text-fg-1">Checkout</span>
        </nav>

        <h1 className="mb-8 font-[family-name:var(--font-display)] text-[26px] font-black uppercase tracking-[-0.01em] text-fg-1 sm:text-[30px]">
          Checkout
        </h1>

        <CheckoutFlow />
      </main>
    </>
  );
}
