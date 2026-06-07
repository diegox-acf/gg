package rest

import (
	"context"
	"net/http"
	"strings"

	"github.com/coreos/go-oidc/v3/oidc"
)

type ctxKey string

const (
	ctxUserID ctxKey = "auth.user_id"
	ctxRoles  ctxKey = "auth.roles"
)

// OptionalAuth validates a Keycloak Bearer token when one is present. The catalog
// is a mostly-public read service, so:
//   - no token        → request proceeds anonymously (public reads still work)
//   - valid token     → subject + realm roles are put on the request context
//   - invalid/expired → 401
//
// Verification (signature via JWKS, issuer, expiry) is delegated to the go-oidc
// verifier. Audience is intentionally not checked (Keycloak access tokens carry
// aud=["account"]); see ADR-017.
func OptionalAuth(verifier *oidc.IDTokenVerifier) func(http.Handler) http.Handler {
	return func(next http.Handler) http.Handler {
		return http.HandlerFunc(func(w http.ResponseWriter, r *http.Request) {
			raw := bearerToken(r)
			if raw == "" {
				next.ServeHTTP(w, r)
				return
			}

			tok, err := verifier.Verify(r.Context(), raw)
			if err != nil {
				writeError(w, http.StatusUnauthorized, "invalid or expired token")
				return
			}

			var claims struct {
				RealmAccess struct {
					Roles []string `json:"roles"`
				} `json:"realm_access"`
			}
			_ = tok.Claims(&claims)

			ctx := context.WithValue(r.Context(), ctxUserID, tok.Subject)
			ctx = context.WithValue(ctx, ctxRoles, claims.RealmAccess.Roles)
			next.ServeHTTP(w, r.WithContext(ctx))
		})
	}
}

func bearerToken(r *http.Request) string {
	h := r.Header.Get("Authorization")
	if len(h) >= 7 && strings.EqualFold(h[:7], "Bearer ") {
		return strings.TrimSpace(h[7:])
	}
	return ""
}

// UserIDFromContext returns the authenticated subject, if a valid token was sent.
func UserIDFromContext(ctx context.Context) (string, bool) {
	v, ok := ctx.Value(ctxUserID).(string)
	return v, ok && v != ""
}

// RolesFromContext returns the caller's realm roles (empty if anonymous).
func RolesFromContext(ctx context.Context) []string {
	v, _ := ctx.Value(ctxRoles).([]string)
	return v
}
