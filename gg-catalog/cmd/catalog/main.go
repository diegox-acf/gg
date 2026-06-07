package main

import (
	"context"
	"fmt"
	"log/slog"
	"net/http"
	"os"
	"os/signal"
	"syscall"

	"github.com/diegox-acf/gg-catalog/internal/catalog"
	_ "github.com/joho/godotenv/autoload"
	"github.com/diegox-acf/gg-catalog/internal/config"
	"github.com/diegox-acf/gg-catalog/internal/observability"
	"github.com/diegox-acf/gg-catalog/internal/postgres"
	"github.com/diegox-acf/gg-catalog/internal/rest"
	localstore "github.com/diegox-acf/gg-catalog/internal/storage/local"
	s3store "github.com/diegox-acf/gg-catalog/internal/storage/s3"
	"github.com/exaring/otelpgx"
	"github.com/jackc/pgx/v5/pgxpool"
)

func main() {
	cfg, err := config.Load()
	if err != nil {
		slog.Error("config load failed", "err", err)
		os.Exit(1)
	}

	logger := observability.NewLogger(cfg.LogLevel)
	slog.SetDefault(logger)

	ctx, cancel := signal.NotifyContext(context.Background(), syscall.SIGINT, syscall.SIGTERM)
	defer cancel()

	shutdown, err := observability.InitOTel(ctx,
		cfg.OTELEndpoint, cfg.ServiceName, cfg.ServiceVersion, cfg.Environment,
	)
	if err != nil {
		logger.Error("otel init failed", "err", err)
		os.Exit(1)
	}
	defer func() {
		if err := shutdown(context.Background()); err != nil {
			logger.Error("otel shutdown error", "err", err)
		}
	}()

	poolCfg, err := pgxpool.ParseConfig(cfg.DatabaseURL)
	if err != nil {
		logger.Error("db config parse failed", "err", err)
		os.Exit(1)
	}
	// QueryTracer emits a span per SQL query, auto-parented to the request span.
	// This is the "→ Postgres" leg of the browser→BFF→Catalog→Postgres trace.
	poolCfg.ConnConfig.Tracer = otelpgx.NewTracer()

	pool, err := pgxpool.NewWithConfig(ctx, poolCfg)
	if err != nil {
		logger.Error("db connect failed", "err", err)
		os.Exit(1)
	}
	defer pool.Close()

	if err := pool.Ping(ctx); err != nil {
		logger.Error("db ping failed", "err", err)
		os.Exit(1)
	}

	images, imageHandler := buildImageStore(cfg, logger)

	repo := postgres.NewRepository(pool)
	svc := catalog.NewService(repo, images)

	// HTTP server (health + metrics + REST product API + image serving)
	httpSrv := &http.Server{
		Addr:    fmt.Sprintf(":%d", cfg.HTTPPort),
		Handler: rest.NewRouter(logger, svc, imageHandler),
	}

	go func() {
		logger.Info("HTTP server started", "port", cfg.HTTPPort)
		if err := httpSrv.ListenAndServe(); err != nil && err != http.ErrServerClosed {
			logger.Error("HTTP server error", "err", err)
		}
	}()

	<-ctx.Done()
	logger.Info("shutting down")

	if err := httpSrv.Shutdown(context.Background()); err != nil {
		logger.Error("HTTP shutdown error", "err", err)
	}
}

func buildImageStore(cfg *config.Config, logger *slog.Logger) (catalog.ImageStore, http.Handler) {
	switch cfg.ImageStoreType {
	case "s3":
		logger.Info("image store: s3 (not yet implemented — uploads will fail)")
		return s3store.New(cfg.ImageStorePath, "us-east-1", ""), nil
	default:
		store, err := localstore.New(cfg.ImageStorePath, cfg.ImageBaseURL)
		if err != nil {
			logger.Error("local image store init failed", "err", err)
			os.Exit(1)
		}
		logger.Info("image store: local", "path", cfg.ImageStorePath)
		return store, store.FileHandler()
	}
}
