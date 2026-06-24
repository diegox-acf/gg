import { createEdgeAuthConfig } from "@gg/auth/edge";

// Edge-safe config (imported by middleware). The shared base + session callback live
// in @gg/auth; only the storefront's route-gating rule is app-specific.
const PROTECTED_PREFIXES = ["/account", "/checkout"];

export const authConfig = createEdgeAuthConfig({
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
});
