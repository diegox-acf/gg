"use client";

import { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { Menu, X } from "lucide-react";
import { signOut } from "next-auth/react";
import { IconBtn } from "./icon-btn";
import { CATEGORY_GROUPS } from "./nav-items";
import { AppearanceMenu } from "../theme/appearance-menu";
import { AppearanceControls } from "../theme/appearance-controls";
import { useCart } from "@/components/cart/cart-provider";
import { useUIStore } from "@/lib/ui/ui-store";

interface Account {
  name: string | null;
  email: string | null;
}

export function NavClient({ account }: { account: Account | null }) {
  const router = useRouter();
  const [menuOpen, setMenuOpen] = useState(false);
  const [accountOpen, setAccountOpen] = useState(false);
  const openCart = useUIStore((s) => s.openCart);
  // Cart is server-seeded via CartProvider, so the count is correct on first
  // render — no hydration gating needed.
  const { count: cartCount } = useCart();

  return (
    <>
      {/* Right-side icon buttons */}
      <div className="flex items-center gap-1">
        {/* Appearance (theme + accent) — hidden on the smallest screens; the
            mobile menu exposes the same controls inline below. */}
        <div className="hidden sm:block">
          <AppearanceMenu />
        </div>

        {/* Account: dropdown when signed in, else straight to /login */}
        <div className="relative">
          <IconBtn
            label={account ? "Account menu" : "Sign in"}
            onClick={() =>
              account ? setAccountOpen((o) => !o) : router.push("/login")
            }
          >
            <svg
              width="17"
              height="17"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="1.75"
              strokeLinecap="round"
              strokeLinejoin="round"
            >
              <path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2" />
              <circle cx="12" cy="7" r="4" />
            </svg>
          </IconBtn>

          {account && accountOpen && (
            <div className="absolute right-0 top-[44px] z-[200] w-52 border border-border bg-surface py-1 shadow-[0_10px_30px_rgba(0,0,0,0.4)]">
              <div className="truncate border-b border-border px-4 py-2 font-body text-[11px] text-fg-3">
                {account.name || account.email}
              </div>
              <Link
                href="/account"
                onClick={() => setAccountOpen(false)}
                className="block px-4 py-2 font-body text-[13px] text-fg-1 hover:bg-primary-muted hover:text-primary"
              >
                Account
              </Link>
              <button
                onClick={() => signOut({ redirectTo: "/" })}
                className="block w-full px-4 py-2 text-left font-body text-[13px] text-fg-1 hover:bg-primary-muted hover:text-primary"
              >
                Sign out
              </button>
            </div>
          )}
        </div>
        <IconBtn label="Cart" badge={cartCount} onClick={openCart}>
          <svg
            width="17"
            height="17"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="1.75"
            strokeLinecap="round"
            strokeLinejoin="round"
          >
            <circle cx="9" cy="21" r="1" />
            <circle cx="20" cy="21" r="1" />
            <path d="M1 1h4l2.68 13.39a2 2 0 0 0 2 1.61h9.72a2 2 0 0 0 2-1.61L23 6H6" />
          </svg>
        </IconBtn>

        {/* Hamburger — visible only on mobile */}
        <button
          aria-label={menuOpen ? "Close menu" : "Open menu"}
          onClick={() => setMenuOpen((o) => !o)}
          className="flex items-center p-2 text-fg-1 transition-colors duration-150 hover:text-primary md:hidden"
        >
          {menuOpen ? <X size={20} /> : <Menu size={20} />}
        </button>
      </div>

      {/* Mobile dropdown menu */}
      {menuOpen && (
        <div className="absolute left-0 right-0 top-[60px] z-[200] max-h-[calc(100vh-60px)] animate-[slideDown_200ms_ease_both] overflow-y-auto border-b border-border bg-surface px-8 py-4 md:hidden">
          {CATEGORY_GROUPS.map((group) => (
            <div key={group.title} className="mb-3">
              <div className="mb-1 mt-2 flex items-center gap-2">
                <span className="h-[10px] w-[3px] bg-primary" aria-hidden="true" />
                <h3 className="font-display text-[10px] font-semibold uppercase tracking-[0.14em] text-fg-3">
                  {group.title}
                </h3>
              </div>
              {group.items.map((item) => (
                <Link
                  key={item.href}
                  href={item.href}
                  onClick={() => setMenuOpen(false)}
                  className="flex items-center gap-3 py-[9px] font-body text-[14px] font-medium tracking-[0.04em] text-fg-1 hover:text-primary"
                >
                  <span aria-hidden="true" className="w-4 text-center text-fg-3">
                    {item.icon}
                  </span>
                  {item.label}
                </Link>
              ))}
            </div>
          ))}

          {/* Appearance controls for mobile (popover trigger is hidden below sm) */}
          <div className="pt-4 sm:hidden">
            <AppearanceControls />
          </div>
        </div>
      )}
    </>
  );
}
