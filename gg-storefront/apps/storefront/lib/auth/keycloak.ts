import "server-only";

// Storefront-only Keycloak Admin REST API client (via the gg-storefront service
// account) — powers self-service registration. The login/refresh/claim-decode bits
// are shared and live in @gg/auth. See ADR-017.

const ISSUER = process.env.KEYCLOAK_ISSUER ?? "http://localhost:8081/realms/gg";
const CLIENT_ID = process.env.KEYCLOAK_CLIENT_ID ?? "gg-storefront";
const CLIENT_SECRET = process.env.KEYCLOAK_CLIENT_SECRET ?? "";

const TOKEN_URL = `${ISSUER}/protocol/openid-connect/token`;
// Admin base: turn .../realms/gg into .../admin/realms/gg
const ADMIN_BASE = ISSUER.replace("/realms/", "/admin/realms/");

/** Client-credentials grant for the gg-storefront service account (Admin API auth). */
async function adminToken(): Promise<string> {
  const res = await fetch(TOKEN_URL, {
    method: "POST",
    headers: { "Content-Type": "application/x-www-form-urlencoded" },
    body: new URLSearchParams({
      grant_type: "client_credentials",
      client_id: CLIENT_ID,
      client_secret: CLIENT_SECRET,
    }),
    cache: "no-store",
  });
  if (!res.ok) throw new Error(`keycloak admin token failed (${res.status})`);
  return ((await res.json()) as { access_token: string }).access_token;
}

export class EmailTakenError extends Error {
  constructor() {
    super("An account with that email already exists.");
    this.name = "EmailTakenError";
  }
}

/**
 * Create a user in the `gg` realm with a permanent password and the `customer`
 * role. Idempotency is not required (registration is user-initiated); a duplicate
 * email surfaces as EmailTakenError.
 */
export async function registerUser(input: {
  email: string;
  password: string;
  firstName: string;
  lastName: string;
}): Promise<void> {
  const token = await adminToken();

  const createRes = await fetch(`${ADMIN_BASE}/users`, {
    method: "POST",
    headers: {
      Authorization: `Bearer ${token}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      username: input.email,
      email: input.email,
      firstName: input.firstName,
      lastName: input.lastName,
      enabled: true,
      emailVerified: true,
      credentials: [
        { type: "password", value: input.password, temporary: false },
      ],
    }),
    cache: "no-store",
  });

  if (createRes.status === 409) throw new EmailTakenError();
  if (!createRes.ok) {
    throw new Error(`keycloak create user failed (${createRes.status})`);
  }

  // Best-effort: assign the `customer` realm role (mirrors the seed user). Login
  // works regardless, so a role-mapping hiccup must not fail registration.
  try {
    const userId = await findUserId(token, input.email);
    if (userId) await assignCustomerRole(token, userId);
  } catch {
    // swallow — role can be granted later; not worth blocking signup
  }
}

async function findUserId(token: string, email: string): Promise<string | null> {
  const res = await fetch(
    `${ADMIN_BASE}/users?exact=true&username=${encodeURIComponent(email)}`,
    { headers: { Authorization: `Bearer ${token}` }, cache: "no-store" },
  );
  if (!res.ok) return null;
  const users = (await res.json()) as Array<{ id: string }>;
  return users[0]?.id ?? null;
}

async function assignCustomerRole(token: string, userId: string): Promise<void> {
  const roleRes = await fetch(`${ADMIN_BASE}/roles/customer`, {
    headers: { Authorization: `Bearer ${token}` },
    cache: "no-store",
  });
  if (!roleRes.ok) return;
  const role = await roleRes.json();
  await fetch(`${ADMIN_BASE}/users/${userId}/role-mappings/realm`, {
    method: "POST",
    headers: {
      Authorization: `Bearer ${token}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify([role]),
    cache: "no-store",
  });
}
