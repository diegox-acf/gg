"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { cn } from "@gg/ui";

interface NavLinkProps {
  href: string;
  children: React.ReactNode;
  exact?: boolean;
}

export function NavLink({ href, children, exact = false }: NavLinkProps) {
  const pathname = usePathname();
  const isActive = exact ? pathname === href : pathname.startsWith(href);

  return (
    <Link
      href={href}
      className={cn(
        "group relative flex shrink-0 flex-col whitespace-nowrap pb-px",
        "font-[family-name:var(--font-body)] text-[12px] font-medium uppercase tracking-[0.1em]",
        "transition-colors duration-150",
        isActive ? "text-primary" : "text-fg-2 hover:text-primary",
      )}
    >
      {children}
      {/* Animated underline */}
      <span
        className={cn(
          "mt-[2px] block h-px bg-primary",
          "transition-transform duration-[200ms] ease-[cubic-bezier(0.16,1,0.3,1)]",
          "origin-left",
          isActive ? "scale-x-100" : "scale-x-0 group-hover:scale-x-100",
        )}
      />
    </Link>
  );
}
