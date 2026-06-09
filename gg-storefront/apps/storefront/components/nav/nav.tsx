import Link from "next/link";
import { Logo } from "@gg/ui";
import { auth } from "@/auth";
import { NavClient } from "./nav-client";
import { CategoryNav } from "./category-nav";

export async function Nav() {
  const session = await auth();
  const account = session?.user
    ? { name: session.user.name ?? null, email: session.user.email ?? null }
    : null;

  return (
    <nav
      className="sticky top-0 z-50 flex h-[60px] items-center border-b border-border px-8"
      style={{ background: "color-mix(in srgb, var(--bg) 92%, transparent)", backdropFilter: "blur(14px)", WebkitBackdropFilter: "blur(14px)" }}
    >
      {/* Logo */}
      <Link href="/" className="flex-shrink-0">
        <Logo size="nav" />
      </Link>

      {/* Desktop: one dropdown per category group, centered across the bar */}
      <div className="hidden flex-1 items-center justify-center md:flex">
        <CategoryNav />
      </div>

      {/* Right side — Client Component handles cart, account, mobile menu */}
      <div className="relative ml-auto">
        <NavClient account={account} />
      </div>
    </nav>
  );
}
