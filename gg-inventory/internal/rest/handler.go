package rest

import (
	"encoding/json"
	"errors"
	"log/slog"
	"net/http"
	"strconv"

	"github.com/diegox-acf/gg-inventory/internal/inventory"
	"github.com/go-chi/chi/v5"
	"github.com/go-chi/chi/v5/middleware"
	"github.com/jackc/pgx/v5"
	"github.com/prometheus/client_golang/prometheus/promhttp"
)

// NewRouter wires all HTTP routes. Inventory is an internal service (called by
// Orders); reads/writes are unauthenticated on the compose network for now.
func NewRouter(logger *slog.Logger, svc *inventory.Service) *chi.Mux {
	r := chi.NewRouter()
	r.Use(middleware.RequestID)
	r.Use(middleware.RealIP)
	r.Use(middleware.Recoverer)
	r.Use(OTelMiddleware)
	r.Use(StructuredLogger(logger))

	r.Get("/health", healthHandler)
	r.Get("/ready", readyHandler)
	r.Handle("/metrics", promhttp.Handler())

	r.Route("/v1", func(r chi.Router) {
		r.Get("/stock/{product_id}", getStockHandler(svc))
		r.Post("/reservations", createReservationHandler(svc))
		r.Post("/reservations/{reservation_id}/commit", commitReservationHandler(svc))
		r.Post("/reservations/{reservation_id}/release", releaseReservationHandler(svc))
	})

	return r
}

func healthHandler(w http.ResponseWriter, _ *http.Request) {
	writeJSON(w, http.StatusOK, map[string]string{"status": "ok"})
}

func readyHandler(w http.ResponseWriter, _ *http.Request) {
	writeJSON(w, http.StatusOK, map[string]string{"status": "ready"})
}

func getStockHandler(svc *inventory.Service) http.HandlerFunc {
	return func(w http.ResponseWriter, r *http.Request) {
		productID, err := strconv.ParseInt(chi.URLParam(r, "product_id"), 10, 64)
		if err != nil {
			writeError(w, http.StatusBadRequest, "invalid product id")
			return
		}
		stock, err := svc.GetStock(r.Context(), productID)
		if err != nil {
			if errors.Is(err, pgx.ErrNoRows) {
				writeError(w, http.StatusNotFound, "no stock record for product")
				return
			}
			writeDomainError(w, err, "failed to get stock")
			return
		}
		writeJSON(w, http.StatusOK, map[string]any{"stock": stock})
	}
}

func createReservationHandler(svc *inventory.Service) http.HandlerFunc {
	return func(w http.ResponseWriter, r *http.Request) {
		var req inventory.ReserveRequest
		if err := json.NewDecoder(r.Body).Decode(&req); err != nil {
			writeError(w, http.StatusBadRequest, "invalid request body")
			return
		}
		// An Idempotency-Key header, if present, overrides the body field.
		if h := r.Header.Get("Idempotency-Key"); h != "" {
			req.IdempotencyKey = h
		}

		reservations, err := svc.Reserve(r.Context(), req)
		if err != nil {
			writeDomainError(w, err, "failed to reserve stock")
			return
		}
		writeJSON(w, http.StatusCreated, map[string]any{
			"order_id":     req.OrderID,
			"reservations": reservations,
		})
	}
}

func commitReservationHandler(svc *inventory.Service) http.HandlerFunc {
	return func(w http.ResponseWriter, r *http.Request) {
		res, err := svc.Commit(r.Context(), chi.URLParam(r, "reservation_id"))
		if err != nil {
			writeDomainError(w, err, "failed to commit reservation")
			return
		}
		writeJSON(w, http.StatusOK, map[string]any{"reservation": res})
	}
}

func releaseReservationHandler(svc *inventory.Service) http.HandlerFunc {
	return func(w http.ResponseWriter, r *http.Request) {
		res, err := svc.Release(r.Context(), chi.URLParam(r, "reservation_id"))
		if err != nil {
			writeDomainError(w, err, "failed to release reservation")
			return
		}
		writeJSON(w, http.StatusOK, map[string]any{"reservation": res})
	}
}

func writeJSON(w http.ResponseWriter, status int, v any) {
	w.Header().Set("Content-Type", "application/json")
	w.WriteHeader(status)
	json.NewEncoder(w).Encode(v)
}

func writeError(w http.ResponseWriter, status int, msg string) {
	writeJSON(w, status, map[string]string{"error": msg})
}

// writeDomainError maps inventory domain errors to HTTP status codes. The error
// message is surfaced for client-facing domain errors; internal failures get a
// generic fallback message.
func writeDomainError(w http.ResponseWriter, err error, fallback string) {
	switch {
	case errors.Is(err, inventory.ErrInvalidRequest):
		writeError(w, http.StatusBadRequest, err.Error())
	case errors.Is(err, inventory.ErrInsufficientStock):
		writeError(w, http.StatusConflict, "insufficient stock")
	case errors.Is(err, inventory.ErrInvalidTransition):
		writeError(w, http.StatusConflict, err.Error())
	case errors.Is(err, inventory.ErrReservationNotFound):
		writeError(w, http.StatusNotFound, "reservation not found")
	case errors.Is(err, inventory.ErrStockConflict):
		// Transient: caller may retry.
		writeError(w, http.StatusServiceUnavailable, "stock contention, retry")
	default:
		writeError(w, http.StatusInternalServerError, fallback)
	}
}
