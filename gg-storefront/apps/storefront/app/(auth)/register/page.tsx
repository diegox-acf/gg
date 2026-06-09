import { Suspense } from "react";
import { redirect } from "next/navigation";
import type { Metadata } from "next";
import { auth } from "@/auth";
import { RegisterForm } from "@/components/auth/register-form";

export const metadata: Metadata = { title: "Create account — GG Gaming" };

export default async function RegisterPage() {
  const session = await auth();
  if (session?.user) redirect("/");

  return (
    <div>
      <h1 className="mb-1 font-display text-[20px] font-extrabold uppercase tracking-[0.08em] text-fg-1">
        Create account
      </h1>
      <p className="mb-6 font-body text-[12px] text-fg-3">
        Join GG Gaming. Max FPS. Zero compromise.
      </p>
      <Suspense>
        <RegisterForm />
      </Suspense>
    </div>
  );
}
