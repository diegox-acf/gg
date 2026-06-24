"use client";

import { useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { signIn } from "next-auth/react";
import { Button, Input } from "@gg/ui";

// Container/Presenter: the page (server) owns the already-signed-in checks; this
// client form owns the credential exchange via Auth.js signIn("credentials").
export function LoginForm() {
  const router = useRouter();
  const params = useSearchParams();
  const callbackUrl = params.get("callbackUrl") ?? "/";

  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    setLoading(true);
    const res = await signIn("credentials", { email, password, redirect: false });
    setLoading(false);
    if (!res || res.error) {
      setError("Invalid email or password.");
      return;
    }
    // Non-admin accounts authenticate fine but are bounced by middleware/layout;
    // the login page then renders the "not authorized" state.
    router.push(callbackUrl);
    router.refresh();
  }

  return (
    <form onSubmit={onSubmit} className="flex flex-col gap-4" noValidate>
      <Input
        label="Email"
        type="email"
        autoComplete="email"
        required
        value={email}
        onChange={(e) => setEmail(e.target.value)}
        placeholder="admin@gg.dev"
      />
      <Input
        label="Password"
        type="password"
        autoComplete="current-password"
        required
        value={password}
        onChange={(e) => setPassword(e.target.value)}
        placeholder="••••••••"
      />

      {error && (
        <p
          role="alert"
          className="border border-danger bg-danger/10 px-3 py-2 font-body text-[12px] text-danger"
        >
          {error}
        </p>
      )}

      <Button type="submit" size="lg" loading={loading} className="mt-1 w-full">
        Sign in
      </Button>
    </form>
  );
}
