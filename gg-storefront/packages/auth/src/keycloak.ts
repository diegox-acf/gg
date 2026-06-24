import "server-only";

// Shared Keycloak `gg` realm client: Direct Access Grant (password) + refresh, plus
// access-token claim decoding. Powers the Auth.js Credentials provider behind the
// branded login forms in both the storefront and the admin dashboard. See ADR-017.
//
// Realm-admin operations (self-service registration via the gg-storefront service
// account) are NOT here — they stay storefront-only.

const ISSUER = process.env.KEYCLOAK_ISSUER ?? "http://localhost:8081/realms/gg";
const CLIENT_ID = process.env.KEYCLOAK_CLIENT_ID ?? "gg-storefront";
const CLIENT_SECRET = process.env.KEYCLOAK_CLIENT_SECRET ?? "";

const TOKEN_URL = `${ISSUER}/protocol/openid-connect/token`;

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
