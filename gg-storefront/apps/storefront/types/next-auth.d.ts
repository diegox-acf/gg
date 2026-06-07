import type { DefaultSession } from "next-auth";

// Augment Auth.js types with the fields we put on the session/JWT.
declare module "next-auth" {
  interface Session {
    error?: string;
    user: {
      id: string;
      roles: string[];
    } & DefaultSession["user"];
  }
}

declare module "next-auth/jwt" {
  interface JWT {
    roles?: string[];
    accessToken?: string;
    refreshToken?: string;
    expiresAt?: number;
    error?: string;
  }
}
