import NextAuth, { type NextAuthResult } from "next-auth";
import Credentials from "next-auth/providers/credentials";
import { authConfig } from "./auth.config";
import {
  passwordGrant,
  refreshTokens,
  decodeClaims,
  rolesFromClaims,
} from "@/lib/auth/keycloak";
import { mergeGuestCartIntoUser } from "@/lib/cart/cart-repo";

// Refresh the access token this many ms before it actually expires.
const REFRESH_SKEW_MS = 30_000;

// Explicit annotations work around next-auth's TS2742 "inferred type cannot be
// named" under pnpm's symlinked node_modules.
const result = NextAuth({
  ...authConfig,
  session: { strategy: "jwt" },
  trustHost: true,
  providers: [
    Credentials({
      // We drive Keycloak's password grant ourselves (custom branded form), so
      // this provider just validates email+password against Keycloak. See ADR-017.
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
              ([claims.given_name, claims.family_name]
                .filter(Boolean)
                .join(" ") ||
                email),
            // carried into the JWT in the jwt() callback below
            roles: rolesFromClaims(claims),
            accessToken: tokens.access_token,
            refreshToken: tokens.refresh_token,
            expiresAt: Date.now() + tokens.expires_in * 1000,
          } as never;
        } catch {
          return null; // surfaces as CredentialsSignin → "invalid credentials"
        }
      },
    }),
  ],
  callbacks: {
    ...authConfig.callbacks,
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
      if (Date.now() < (token.expiresAt as number) - REFRESH_SKEW_MS) {
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
    async session({ session, token }) {
      // Expose only identity to the session — never the raw tokens (would leak to
      // the client). Downstream service calls use x-user-id / x-user-roles headers.
      if (session.user) {
        session.user.id = token.sub as string;
        session.user.roles = (token.roles as string[]) ?? [];
      }
      session.error = token.error as string | undefined;
      return session;
    },
  },
  events: {
    // On login, fold any guest cart (cart:guest:<cookie>) into the user's cart
    // so nothing is lost (exit criterion 4). Never block login on a merge failure.
    async signIn({ user }) {
      if (user?.id) {
        try {
          await mergeGuestCartIntoUser(user.id);
        } catch (err) {
          console.warn("[auth] guest cart merge failed:", err);
        }
      }
    },
  },
});

export const handlers: NextAuthResult["handlers"] = result.handlers;
export const auth: NextAuthResult["auth"] = result.auth;
export const signIn: NextAuthResult["signIn"] = result.signIn;
export const signOut: NextAuthResult["signOut"] = result.signOut;
