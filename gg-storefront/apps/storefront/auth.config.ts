import type { NextAuthConfig } from "next-auth";

// Edge-safe base config. Imported by both middleware (edge runtime) and the full
// auth.ts — so it must NOT pull in node-only code (Buffer, "server-only", the
// Keycloak client). Providers and the node callbacks live in auth.ts.
const PROTECTED_PREFIXES = ["/account", "/checkout"];

export const authConfig = {
  pages: { signIn: "/login" },
  providers: [],
  callbacks: {
    // Runs in middleware: gate protected routes. Returning false redirects to
    // pages.signIn with a ?callbackUrl back to the requested path.
    authorized({ auth, request: { nextUrl } }) {
      const isLoggedIn = !!auth?.user;
      const isProtected = PROTECTED_PREFIXES.some((p) =>
        nextUrl.pathname.startsWith(p),
      );
      if (isProtected) return isLoggedIn;
      return true;
    },
  },
} satisfies NextAuthConfig;
