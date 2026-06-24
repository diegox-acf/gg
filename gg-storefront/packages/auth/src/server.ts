import "./types";
import type { NextAuthConfig } from "next-auth";
import Credentials from "next-auth/providers/credentials";
import { createEdgeAuthConfig } from "./edge";
import {
  passwordGrant,
  refreshTokens,
  decodeClaims,
  rolesFromClaims,
} from "./keycloak";

// Refresh the access token this many ms before it actually expires.
const REFRESH_SKEW_MS = 30_000;

type AuthorizedCallback = NonNullable<NextAuthConfig["callbacks"]>["authorized"];

/**
 * Credentials provider that drives Keycloak's password grant ourselves (custom branded
 * form), so it just validates email+password against Keycloak. See ADR-017. The returned
 * fields are carried into the JWT by the jwt() callback below.
 */
function credentialsProvider() {
  return Credentials({
    credentials: { email: {}, password: {} },
    async authorize(credentials) {
      const email = credentials?.email as string | undefined;
      const password = credentials?.password as string | undefined;
      if (!email || !password) return null;
      try {
        const tokens = await passwordGrant(email, password);
        const claims = decodeClaims(tokens.access_token);
        return {
          id: claims.sub,
          email: claims.email ?? email,
          name:
            claims.name ??
            ([claims.given_name, claims.family_name].filter(Boolean).join(" ") ||
              email),
          roles: rolesFromClaims(claims),
          accessToken: tokens.access_token,
          refreshToken: tokens.refresh_token,
          expiresAt: Date.now() + tokens.expires_in * 1000,
        } as never;
      } catch {
        return null; // surfaces as CredentialsSignin → "invalid credentials"
      }
    },
  });
}

/**
 * Full (node-runtime) NextAuth config shared by every app. Composes the edge-safe base
 * (pages, `authorized`, session callback) with the Keycloak Credentials provider and the
 * token-refresh jwt callback. `authorized` and `events` are app-specific: the storefront
 * passes a guest-cart-merge signIn event; the admin app passes none.
 */
export function createAuthConfig({
  authorized,
  events,
}: {
  authorized: AuthorizedCallback;
  events?: NextAuthConfig["events"];
}): NextAuthConfig {
  const base = createEdgeAuthConfig({ authorized });
  return {
    ...base, // includes trustHost
    session: { strategy: "jwt" },
    providers: [credentialsProvider()],
    callbacks: {
      ...base.callbacks,
      async jwt({ token, user }) {
        // Initial sign-in: copy fields from the authorize() result into the JWT.
        if (user) {
          const u = user as unknown as {
            id: string;
            roles: string[];
            accessToken: string;
            refreshToken: string;
            expiresAt: number;
          };
          token.sub = u.id;
          token.roles = u.roles;
          token.accessToken = u.accessToken;
          token.refreshToken = u.refreshToken;
          token.expiresAt = u.expiresAt;
          return token;
        }

        // Still valid — reuse.
        if (Date.now() < (token.expiresAt ?? 0) - REFRESH_SKEW_MS) {
          return token;
        }

        // Expired — refresh against Keycloak.
        try {
          const refreshed = await refreshTokens(token.refreshToken as string);
          token.accessToken = refreshed.access_token;
          token.refreshToken = refreshed.refresh_token;
          token.expiresAt = Date.now() + refreshed.expires_in * 1000;
          delete token.error;
        } catch {
          token.error = "RefreshTokenError";
        }
        return token;
      },
    },
    events,
  } satisfies NextAuthConfig;
}
