import { Suspense } from "react";
import { redirect } from "next/navigation";
import type { Metadata } from "next";
import { auth } from "@/auth";
import { LoginForm } from "@/components/auth/login-form";

export const metadata: Metadata = { title: "Sign in — GG Gaming" };

export default async function LoginPage() {
  // Already signed in? Send them home.
  const session = await auth();
  if (session?.user) redirect("/");

  return (
    <div>
      <h1 className="mb-1 font-display text-[20px] font-extrabold uppercase tracking-[0.08em] text-fg-1">
        Sign in
      </h1>
      <p className="mb-6 font-body text-[12px] text-fg-3">
        Welcome back, gamer.
      </p>
      <Suspense>
        <LoginForm />
      </Suspense>
    </div>
  );
}
