import { createEdgeAuthConfig } from "@gg/auth/edge";

// Edge-safe config (imported by middleware). The admin app gates EVERYTHING behind
// the `admin` realm role — only the login route is open. The session callback in
// @gg/auth populates auth.user.roles, so this role check works at the edge too; the
// (admin) layout repeats it server-side as the authoritative gate.
export const authConfig = createEdgeAuthConfig({
  authorized({ auth, request: { nextUrl } }) {
    if (nextUrl.pathname.startsWith("/login")) return true;
    const user = auth?.user;
    return !!user && (user.roles ?? []).includes("admin");
  },
});
