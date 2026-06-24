import NextAuth, { type NextAuthResult } from "next-auth";
import { authConfig } from "./auth.config";

// Edge middleware uses only the edge-safe base config (no Keycloak/node imports).
export const middleware: NextAuthResult["auth"] = NextAuth(authConfig).auth;

export const config = {
  // Gate everything except the login route, the auth API, and static assets.
  matcher: ["/((?!login|api/auth|_next/static|_next/image|favicon.ico).*)"],
};
