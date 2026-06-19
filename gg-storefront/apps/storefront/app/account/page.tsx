import type { Metadata } from "next";
import Link from "next/link";
import { redirect } from "next/navigation";
import { buttonVariants } from "@gg/ui";
import { auth } from "@/auth";
import { Nav } from "@/components/nav/nav";
import { SignOutButton } from "@/components/auth/sign-out-button";

export const metadata: Metadata = { title: "Your account — GG Gaming" };

// Protected by middleware; this guard is defense-in-depth + types.
export default async function AccountPage() {
  const session = await auth();
  if (!session?.user) redirect("/login?callbackUrl=/account");

  const { name, email, roles } = session.user;

  return (
    <>
      <Nav />
      <main className="mx-auto max-w-[720px] px-4 py-12 sm:px-8">
        <h1 className="mb-6 font-display text-[24px] font-extrabold uppercase tracking-[0.08em] text-fg-1">
          Your account
        </h1>

        <dl className="mb-8 grid grid-cols-1 gap-px border border-border bg-border sm:grid-cols-[160px_1fr]">
          <Row label="Name" value={name ?? "—"} />
          <Row label="Email" value={email ?? "—"} />
          <Row label="Roles" value={roles.length ? roles.join(", ") : "customer"} />
        </dl>

        <div className="mb-8 flex flex-wrap gap-3">
          <Link href="/account/orders" className={buttonVariants()}>
            View orders
          </Link>
        </div>

        <SignOutButton />
      </main>
    </>
  );
}

function Row({ label, value }: { label: string; value: string }) {
  return (
    <>
      <dt className="bg-surface px-4 py-3 font-display text-[10px] font-semibold uppercase tracking-[0.12em] text-fg-3">
        {label}
      </dt>
      <dd className="bg-surface px-4 py-3 font-body text-[13px] text-fg-1">
        {value}
      </dd>
    </>
  );
}
