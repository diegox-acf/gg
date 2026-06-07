import "server-only";

// Thin client for the Keycloak `gg` realm. Two responsibilities:
//  1. Direct Access Grant (password) + refresh — powers the Auth.js Credentials
//     provider behind our custom branded login form.
//  2. Admin REST API (via the gg-storefront service account) — powers self-service
//     registration. See ADR-017.

const ISSUER = process.env.KEYCLOAK_ISSUER ?? "http://localhost:8081/realms/gg";
const CLIENT_ID = process.env.KEYCLOAK_CLIENT_ID ?? "gg-storefront";
const CLIENT_SECRET = process.env.KEYCLOAK_CLIENT_SECRET ?? "";

const TOKEN_URL = `${ISSUER}/protocol/openid-connect/token`;
// Admin base: turn .../realms/gg into .../admin/realms/gg
const ADMIN_BASE = ISSUER.replace("/realms/", "/admin/realms/");

export interface TokenSet {
  access_token: string;
  refresh_token: string;
  expires_in: number;
  refresh_expires_in: number;
}

/** Claims we read out of a Keycloak access token (already issued by Keycloak — no local verification). */
export interface KeycloakClaims {
  sub: string;
  email?: string;
  preferred_username?: string;
  given_name?: string;
  family_name?: string;
  name?: string;
  realm_access?: { roles?: string[] };
}

/** Decode (not verify) a JWT payload. The token came straight from Keycloak's token endpoint. */
export function decodeClaims(accessToken: string): KeycloakClaims {
  const payload = accessToken.split(".")[1];
  if (!payload) throw new Error("malformed access token");
  const json = Buffer.from(payload, "base64url").toString("utf8");
  return JSON.parse(json) as KeycloakClaims;
}

export function rolesFromClaims(claims: KeycloakClaims): string[] {
  return claims.realm_access?.roles ?? [];
}

/** Resource Owner Password Credentials grant. Throws on invalid credentials. */
export async function passwordGrant(
  username: string,
  password: string,
): Promise<TokenSet> {
  const res = await fetch(TOKEN_URL, {
    method: "POST",
    headers: { "Content-Type": "application/x-www-form-urlencoded" },
    body: new URLSearchParams({
      grant_type: "password",
      client_id: CLIENT_ID,
      client_secret: CLIENT_SECRET,
      username,
      password,
      scope: "openid",
    }),
    cache: "no-store",
  });
  if (!res.ok) {
    throw new Error(`keycloak password grant failed (${res.status})`);
  }
  return (await res.json()) as TokenSet;
}

/** Exchange a refresh token for a fresh access token. Throws if the refresh token is expired/invalid. */
export async function refreshTokens(refreshToken: string): Promise<TokenSet> {
  const res = await fetch(TOKEN_URL, {
    method: "POST",
    headers: { "Content-Type": "application/x-www-form-urlencoded" },
    body: new URLSearchParams({
      grant_type: "refresh_token",
      client_id: CLIENT_ID,
      client_secret: CLIENT_SECRET,
      refresh_token: refreshToken,
    }),
    cache: "no-store",
  });
  if (!res.ok) {
    throw new Error(`keycloak token refresh failed (${res.status})`);
  }
  return (await res.json()) as TokenSet;
}

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
