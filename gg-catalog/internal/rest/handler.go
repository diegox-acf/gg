package rest

import (
	"encoding/json"
	"errors"
	"log/slog"
	"net/http"
	"strconv"

	"github.com/diegox-acf/gg-catalog/internal/catalog"
	"github.com/go-chi/chi/v5"
	"github.com/go-chi/chi/v5/middleware"
	"github.com/jackc/pgx/v5"
	"github.com/prometheus/client_golang/prometheus/promhttp"
)

// NewRouter wires all HTTP routes.
// imageHandler, when non-nil, is mounted at /images and serves stored image files.
// Pass nil when using S3 (images are served directly from S3/CDN URLs).
func NewRouter(logger *slog.Logger, svc *catalog.Service, imageHandler http.Handler) *chi.Mux {
	r := chi.NewRouter()
	r.Use(middleware.RequestID)
	r.Use(middleware.RealIP)
	r.Use(middleware.Recoverer)
	r.Use(OTelMiddleware)
	r.Use(StructuredLogger(logger))

	r.Get("/health", healthHandler)
	r.Get("/ready", readyHandler)
	r.Handle("/metrics", promhttp.Handler())

	if imageHandler != nil {
		r.Mount("/images", imageHandler)
	}

	r.Route("/v1", func(r chi.Router) {
		r.Get("/categories", listCategoriesHandler(svc))
		r.Get("/products", listProductsHandler(svc))
		r.Get("/products/slug/{slug}", getProductBySlugHandler(svc))
		r.Get("/products/{id}", getProductHandler(svc))
		r.Get("/products/{id}/images", listImagesHandler(svc))
		r.Post("/products/{id}/images", uploadImageHandler(svc))
		r.Delete("/images/{id}", deleteImageHandler(svc))
	})

	return r
}

func healthHandler(w http.ResponseWriter, _ *http.Request) {
	writeJSON(w, http.StatusOK, map[string]string{"status": "ok"})
}

func readyHandler(w http.ResponseWriter, _ *http.Request) {
	writeJSON(w, http.StatusOK, map[string]string{"status": "ready"})
}

func listCategoriesHandler(svc *catalog.Service) http.HandlerFunc {
	return func(w http.ResponseWriter, r *http.Request) {
		categories, err := svc.ListCategories(r.Context())
		if err != nil {
			writeError(w, http.StatusInternalServerError, "failed to list categories")
			return
		}
		writeJSON(w, http.StatusOK, map[string]any{"categories": categories})
	}
}

func listProductsHandler(svc *catalog.Service) http.HandlerFunc {
	return func(w http.ResponseWriter, r *http.Request) {
		q := r.URL.Query()
		pageSize := 20
		if n, err := strconv.Atoi(q.Get("page_size")); err == nil && n > 0 && n <= 100 {
			pageSize = n
		}

		products, nextToken, err := svc.ListProducts(r.Context(), catalog.ListProductsFilter{
			CategoryID: q.Get("category_id"),
			PageSize:   int32(pageSize),
			PageToken:  q.Get("page_token"),
		})
		if err != nil {
			writeError(w, http.StatusInternalServerError, "failed to list products")
			return
		}

		writeJSON(w, http.StatusOK, map[string]any{
			"products":        products,
			"next_page_token": nextToken,
		})
	}
}

func getProductHandler(svc *catalog.Service) http.HandlerFunc {
	return func(w http.ResponseWriter, r *http.Request) {
		id, err := strconv.ParseInt(chi.URLParam(r, "id"), 10, 64)
		if err != nil {
			writeError(w, http.StatusBadRequest, "invalid product id")
			return
		}

		product, err := svc.GetProduct(r.Context(), id)
		if err != nil {
			if errors.Is(err, pgx.ErrNoRows) {
				writeError(w, http.StatusNotFound, "product not found")
				return
			}
			writeError(w, http.StatusInternalServerError, "failed to get product")
			return
		}

		writeJSON(w, http.StatusOK, map[string]any{"product": product})
	}
}

func getProductBySlugHandler(svc *catalog.Service) http.HandlerFunc {
	return func(w http.ResponseWriter, r *http.Request) {
		slug := chi.URLParam(r, "slug")
		if slug == "" {
			writeError(w, http.StatusBadRequest, "slug is required")
			return
		}

		product, err := svc.GetProductBySlug(r.Context(), slug)
		if err != nil {
			if errors.Is(err, pgx.ErrNoRows) {
				writeError(w, http.StatusNotFound, "product not found")
				return
			}
			writeError(w, http.StatusInternalServerError, "failed to get product")
			return
		}

		writeJSON(w, http.StatusOK, map[string]any{"product": product})
	}
}

func listImagesHandler(svc *catalog.Service) http.HandlerFunc {
	return func(w http.ResponseWriter, r *http.Request) {
		id, err := strconv.ParseInt(chi.URLParam(r, "id"), 10, 64)
		if err != nil {
			writeError(w, http.StatusBadRequest, "invalid product id")
			return
		}

		imgs, err := svc.ListImages(r.Context(), id)
		if err != nil {
			writeError(w, http.StatusInternalServerError, "failed to list images")
			return
		}

		writeJSON(w, http.StatusOK, map[string]any{"images": imgs})
	}
}

func uploadImageHandler(svc *catalog.Service) http.HandlerFunc {
	const maxSize = 10 << 20 // 10 MB
	return func(w http.ResponseWriter, r *http.Request) {
		id, err := strconv.ParseInt(chi.URLParam(r, "id"), 10, 64)
		if err != nil {
			writeError(w, http.StatusBadRequest, "invalid product id")
			return
		}

		r.Body = http.MaxBytesReader(w, r.Body, maxSize)
		if err := r.ParseMultipartForm(maxSize); err != nil {
			writeError(w, http.StatusBadRequest, "request too large or invalid multipart form")
			return
		}

		file, header, err := r.FormFile("image")
		if err != nil {
			writeError(w, http.StatusBadRequest, "image field is required")
			return
		}
		defer file.Close()

		img, err := svc.UploadImage(r.Context(), id, header.Filename, file, header.Size, header.Header.Get("Content-Type"))
		if err != nil {
			if errors.Is(err, pgx.ErrNoRows) {
				writeError(w, http.StatusNotFound, "product not found")
				return
			}
			writeError(w, http.StatusInternalServerError, "failed to upload image")
			return
		}

		writeJSON(w, http.StatusCreated, map[string]any{"image": img})
	}
}

func deleteImageHandler(svc *catalog.Service) http.HandlerFunc {
	return func(w http.ResponseWriter, r *http.Request) {
		id, err := strconv.ParseInt(chi.URLParam(r, "id"), 10, 64)
		if err != nil {
			writeError(w, http.StatusBadRequest, "invalid image id")
			return
		}

		if err := svc.DeleteImage(r.Context(), id); err != nil {
			if errors.Is(err, pgx.ErrNoRows) {
				writeError(w, http.StatusNotFound, "image not found")
				return
			}
			writeError(w, http.StatusInternalServerError, "failed to delete image")
			return
		}

		w.WriteHeader(http.StatusNoContent)
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
