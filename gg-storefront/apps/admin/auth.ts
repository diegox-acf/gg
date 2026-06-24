import NextAuth, { type NextAuthResult } from "next-auth";
import { createAuthConfig } from "@gg/auth";
import { authConfig } from "./auth.config";

// Shared Keycloak/Credentials/refresh config from @gg/auth; the admin app only adds
// its own `authorized` rule (admin-role gate) and no events (no cart to merge).
//
// Explicit annotations work around next-auth's TS2742 "inferred type cannot be
// named" under pnpm's symlinked node_modules.
const result = NextAuth(
  createAuthConfig({
    authorized: authConfig.callbacks!.authorized!,
  }),
);

export const handlers: NextAuthResult["handlers"] = result.handlers;
export const auth: NextAuthResult["auth"] = result.auth;
export const signIn: NextAuthResult["signIn"] = result.signIn;
export const signOut: NextAuthResult["signOut"] = result.signOut;
