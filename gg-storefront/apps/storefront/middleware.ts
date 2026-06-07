import NextAuth, { type NextAuthResult } from "next-auth";
import { authConfig } from "./auth.config";

// Edge middleware uses only the edge-safe base config (no Keycloak/node imports).
export const middleware: NextAuthResult["auth"] = NextAuth(authConfig).auth;

export const config = {
  matcher: ["/account/:path*", "/checkout/:path*"],
};
