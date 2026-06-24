import type { DefaultSession } from "next-auth";

// Augment Auth.js types with the fields we put on the session/JWT. This lives in
// @gg/auth (consumed as raw source via the package exports map, no build step), so
// the augmentation propagates to every app that imports the package — both the
// storefront and the admin dashboard share one definition.
declare module "next-auth" {
  interface Session {
    error?: string;
    user: {
      id: string;
      roles: string[];
    } & DefaultSession["user"];
  }
}

// Augment the source module (@auth/core/jwt) rather than the bare `export *`
// re-export at next-auth/jwt, which TS refuses to augment (TS2664). next-auth's JWT
// is this same interface, so the callbacks see these fields either way.
declare module "@auth/core/jwt" {
  interface JWT {
    roles?: string[];
    accessToken?: string;
    refreshToken?: string;
    expiresAt?: number;
    error?: string;
  }
}

export {};
