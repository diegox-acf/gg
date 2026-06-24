import { Suspense } from "react";
import { redirect } from "next/navigation";
import type { Metadata } from "next";
import { Logo } from "@gg/ui";
import { auth } from "@/auth";
import { LoginForm } from "@/components/auth/login-form";
import { SignOutButton } from "@/components/auth/sign-out-button";

export const metadata: Metadata = { title: "Sign in — GG Admin" };

export default async function LoginPage() {
  const session = await auth();
  const isAdmin = !!session?.user && session.user.roles.includes("admin");
  if (isAdmin) redirect("/");

  // Authenticated but not an admin: dead-end with a way back out.
  const signedInNonAdmin = !!session?.user && !isAdmin;

  return (
    <main className="flex min-h-screen flex-col items-center justify-center px-4 py-12">
      <div className="mb-8 flex flex-col items-center gap-2">
        <Logo size="lg" />
        <span className="font-display text-[10px] font-semibold uppercase tracking-[0.28em] text-fg-3">
          Admin Console
        </span>
      </div>
      <div className="w-full max-w-[400px] border border-border bg-surface px-6 py-8 clip-cyber sm:px-8">
        {signedInNonAdmin ? (
          <div className="flex flex-col gap-4">
            <h1 className="font-display text-[18px] font-extrabold uppercase tracking-[0.08em] text-fg-1">
              Not authorized
            </h1>
            <p className="font-body text-[13px] text-fg-2">
              This account doesn&apos;t have administrator access. Sign in with an
              admin account to continue.
            </p>
            <SignOutButton
              label="Sign out"
              className="mt-1 inline-flex items-center justify-center gap-2 border border-border-strong px-4 py-2 font-display text-[11px] font-semibold uppercase tracking-[0.1em] text-fg-1 transition-colors hover:border-primary hover:text-primary clip-cyber-btn"
            />
          </div>
        ) : (
          <>
            <h1 className="mb-1 font-display text-[20px] font-extrabold uppercase tracking-[0.08em] text-fg-1">
              Sign in
            </h1>
            <p className="mb-6 font-body text-[12px] text-fg-3">
              Operations console — staff only.
            </p>
            <Suspense>
              <LoginForm />
            </Suspense>
          </>
        )}
      </div>
    </main>
  );
}
