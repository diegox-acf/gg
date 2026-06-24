import "server-only";

import { auth } from "@/auth";

// Forwards the authenticated admin's identity + roles to the backend admin APIs.
// The BFF is the trust boundary (ADR-022): it resolved the Keycloak session, so the
// backends trust X-User-Id / X-User-Roles. Pages are already gated to the admin role
// by the (admin) layout, so a non-admin never reaches these clients.
export async function adminHeaders(): Promise<Record<string, string>> {
  const session = await auth();
  return {
    "X-User-Id": session?.user?.id ?? "",
    "X-User-Roles": (session?.user?.roles ?? []).join(","),
  };
}
