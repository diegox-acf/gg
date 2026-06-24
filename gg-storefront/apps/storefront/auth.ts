import NextAuth, { type NextAuthResult } from "next-auth";
import { createAuthConfig } from "@gg/auth";
import { mergeGuestCartIntoUser } from "@/lib/cart/cart-repo";

// The shared providers/callbacks/refresh logic live in @gg/auth (createAuthConfig).
// The storefront only adds its app-specific bits: the route-gating `authorized` rule
// (reused from auth.config) and a guest-cart-merge signIn event.
import { authConfig } from "./auth.config";

// Explicit annotations work around next-auth's TS2742 "inferred type cannot be
// named" under pnpm's symlinked node_modules.
const result = NextAuth(
  createAuthConfig({
    authorized: authConfig.callbacks!.authorized!,
    events: {
      // On login, fold any guest cart (cart:guest:<cookie>) into the user's cart so
      // nothing is lost (exit criterion 4). Never block login on a merge failure.
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
  }),
);

export const handlers: NextAuthResult["handlers"] = result.handlers;
export const auth: NextAuthResult["auth"] = result.auth;
export const signIn: NextAuthResult["signIn"] = result.signIn;
export const signOut: NextAuthResult["signOut"] = result.signOut;
