package rest

import (
	"net/http"
	"net/http/httptest"
	"testing"

	"github.com/stretchr/testify/require"
)

func TestRequireAdmin(t *testing.T) {
	next := http.HandlerFunc(func(w http.ResponseWriter, _ *http.Request) {
		w.WriteHeader(http.StatusOK)
	})
	handler := RequireAdmin(next)

	cases := []struct {
		name  string
		roles string
		want  int
	}{
		{"no header", "", http.StatusForbidden},
		{"customer only", "customer", http.StatusForbidden},
		{"admin", "admin", http.StatusOK},
		{"admin among many", "customer, admin", http.StatusOK},
		{"case-insensitive", "ADMIN", http.StatusOK},
	}
	for _, tc := range cases {
		t.Run(tc.name, func(t *testing.T) {
			req := httptest.NewRequest(http.MethodPost, "/v1/products", nil)
			if tc.roles != "" {
				req.Header.Set("X-User-Roles", tc.roles)
			}
			rec := httptest.NewRecorder()
			handler.ServeHTTP(rec, req)
			require.Equal(t, tc.want, rec.Code)
		})
	}
}
