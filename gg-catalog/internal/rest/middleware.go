package rest

import (
	"log/slog"
	"net/http"
	"strings"
	"time"

	"github.com/go-chi/chi/v5/middleware"
	"go.opentelemetry.io/contrib/instrumentation/net/http/otelhttp"
)

const (
	rolesHeader = "X-User-Roles"
	adminRole   = "admin"
)

// RequireAdmin guards admin write routes. The BFF (trust boundary, ADR-022) validates
// the Keycloak session and forwards the caller's realm roles as a comma-separated
// X-User-Roles header; a request without the admin role gets 403. (Catalog also runs
// OptionalAuth for public reads — that path is unaffected.)
func RequireAdmin(next http.Handler) http.Handler {
	return http.HandlerFunc(func(w http.ResponseWriter, r *http.Request) {
		if !hasRole(r.Header.Get(rolesHeader), adminRole) {
			writeError(w, http.StatusForbidden, "admin role required")
			return
		}
		next.ServeHTTP(w, r)
	})
}

func hasRole(header, role string) bool {
	for _, part := range strings.Split(header, ",") {
		if strings.EqualFold(strings.TrimSpace(part), role) {
			return true
		}
	}
	return false
}

func OTelMiddleware(next http.Handler) http.Handler {
	return otelhttp.NewHandler(next, "http")
}

func StructuredLogger(logger *slog.Logger) func(http.Handler) http.Handler {
	return func(next http.Handler) http.Handler {
		return http.HandlerFunc(func(w http.ResponseWriter, r *http.Request) {
			start := time.Now()
			ww := middleware.NewWrapResponseWriter(w, r.ProtoMajor)
			next.ServeHTTP(ww, r)
			logger.InfoContext(r.Context(), "request",
				"method", r.Method,
				"path", r.URL.Path,
				"status", ww.Status(),
				"bytes", ww.BytesWritten(),
				"duration_ms", time.Since(start).Milliseconds(),
				"request_id", middleware.GetReqID(r.Context()),
			)
		})
	}
}
