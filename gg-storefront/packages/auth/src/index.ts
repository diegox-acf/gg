import "./types";

// Node-runtime entry. Edge files (middleware, auth.config) must import from
// "@gg/auth/edge" instead, to avoid pulling the server-only Keycloak client.
export { createAuthConfig } from "./server";
export { createEdgeAuthConfig } from "./edge";
export {
  passwordGrant,
  refreshTokens,
  decodeClaims,
  rolesFromClaims,
  type TokenSet,
  type KeycloakClaims,
} from "./keycloak";
