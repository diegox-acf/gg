"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { Logo, cn } from "@gg/ui";
import {
  LayoutDashboard,
  ShoppingCart,
  Boxes,
  Package,
  type LucideIcon,
} from "lucide-react";
import { SignOutButton } from "@/components/auth/sign-out-button";

const NAV: { href: string; label: string; icon: LucideIcon }[] = [
  { href: "/", label: "Dashboard", icon: LayoutDashboard },
  { href: "/orders", label: "Orders", icon: ShoppingCart },
  { href: "/inventory", label: "Inventory", icon: Boxes },
  { href: "/products", label: "Products", icon: Package },
];

function isActive(pathname: string, href: string): boolean {
  return href === "/" ? pathname === "/" : pathname.startsWith(href);
}

export function Sidebar({ email }: { email?: string | null }) {
  const pathname = usePathname();

  return (
    <aside className="flex w-[240px] shrink-0 flex-col border-r border-border bg-surface">
      <div className="flex items-center gap-2 border-b border-border px-5 py-4">
        <Logo size="nav" />
        <span className="font-display text-[9px] font-semibold uppercase tracking-[0.24em] text-fg-3">
          Admin
        </span>
      </div>

      <nav className="flex flex-1 flex-col gap-1 p-3">
        {NAV.map(({ href, label, icon: Icon }) => {
          const active = isActive(pathname, href);
          return (
            <Link
              key={href}
              href={href}
              className={cn(
                "flex items-center gap-3 px-3 py-2 font-display text-[11px] font-semibold uppercase tracking-[0.1em] transition-colors clip-cyber-xs",
                active
                  ? "bg-primary/10 text-primary"
                  : "text-fg-2 hover:bg-elevated hover:text-fg-1",
              )}
            >
              <Icon className="size-4" />
              {label}
            </Link>
          );
        })}
      </nav>

      <div className="border-t border-border p-3">
        {email && (
          <p className="mb-2 truncate px-3 font-body text-[11px] text-fg-3" title={email}>
            {email}
          </p>
        )}
        <SignOutButton
          label="Sign out"
          className="flex w-full items-center gap-3 px-3 py-2 font-display text-[11px] font-semibold uppercase tracking-[0.1em] text-fg-2 transition-colors hover:text-danger"
        />
      </div>
    </aside>
  );
}
