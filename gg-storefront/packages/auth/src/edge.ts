import "./types";
import type { NextAuthConfig } from "next-auth";

// Edge-safe auth config shared by middleware (edge runtime) and the full node config
// in ./server. It must NOT pull in node-only code (the Keycloak client, "server-only",
// Buffer) — providers and the token-refresh jwt callback live in ./server.

type AuthorizedCallback = NonNullable<NextAuthConfig["callbacks"]>["authorized"];

/**
 * Build the edge-safe base config. `authorized` is app-specific: the storefront gates
 * a few prefixes, the admin app gates everything to the `admin` role. The session
 * callback (token → session shape, incl. roles) is shared and edge-safe, so role
 * checks work in middleware too.
 */
export function createEdgeAuthConfig({
  authorized,
}: {
  authorized: AuthorizedCallback;
}): NextAuthConfig {
  return {
    // Trust the deployment host. In dev (`next dev`) Auth.js trusts localhost
    // automatically, but in production (`next start`, i.e. the containers) it does
    // not — without this the middleware throws UntrustedHost. Set here (the edge
    // base) so both the middleware and the full node config inherit it.
    trustHost: true,
    pages: { signIn: "/login" },
    providers: [],
    callbacks: {
      authorized,
      // Expose only identity to the session — never raw tokens (would leak to the
      // client). Downstream service calls use x-user-id / x-user-roles headers.
      async session({ session, token }) {
        if (session.user) {
          session.user.id = token.sub as string;
          session.user.roles = token.roles ?? [];
        }
        session.error = token.error;
        return session;
      },
    },
  } satisfies NextAuthConfig;
}
