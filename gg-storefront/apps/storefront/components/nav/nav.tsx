import Link from "next/link";
import { Logo } from "@gg/ui";
import { auth } from "@/auth";
import { NavLink } from "./nav-link";
import { NavClient } from "./nav-client";

const NAV_ITEMS = [
  { label: "GPUs", href: "/category/gpus" },
  { label: "CPUs", href: "/category/cpus" },
  { label: "Peripherals", href: "/category/peripherals" },
  { label: "Storage", href: "/category/storage" },
  { label: "Cases", href: "/category/cases" },
];

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

      {/* Desktop nav links — centered */}
      <div className="hidden flex-1 items-center justify-center gap-8 md:flex">
        {NAV_ITEMS.map((item) => (
          <NavLink key={item.href} href={item.href}>
            {item.label}
          </NavLink>
        ))}
      </div>

      {/* Right side — Client Component handles cart, account, mobile menu */}
      <div className="relative ml-auto">
        <NavClient account={account} />
      </div>
    </nav>
  );
}
