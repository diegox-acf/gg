import Link from "next/link";
import { Logo } from "@gg/ui";

// Shared chrome for the auth routes: centered branded card on the blueprint bg.
export default function AuthLayout({ children }: { children: React.ReactNode }) {
  return (
    <main className="flex min-h-screen flex-col items-center justify-center px-4 py-12">
      <Link href="/" className="mb-8">
        <Logo size="lg" />
      </Link>
      <div className="w-full max-w-[400px] border border-border bg-surface px-6 py-8 clip-cyber sm:px-8">
        {children}
      </div>
    </main>
  );
}
