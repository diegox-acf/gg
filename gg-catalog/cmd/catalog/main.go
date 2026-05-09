package main

import (
	"context"
	"fmt"
	"log/slog"
	"net"
	"net/http"
	"os"
	"os/signal"
	"syscall"

	"github.com/diegox-acf/gg-catalog/internal/catalog"
	grpcserver "github.com/diegox-acf/gg-catalog/internal/grpc"
	"github.com/diegox-acf/gg-catalog/internal/config"
	"github.com/diegox-acf/gg-catalog/internal/observability"
	"github.com/diegox-acf/gg-catalog/internal/postgres"
	"github.com/diegox-acf/gg-catalog/internal/rest"
	catalogv1 "github.com/diegox-acf/gg-proto/gen/catalog/v1"
	"github.com/jackc/pgx/v5/pgxpool"
	"google.golang.org/grpc"
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

	pool, err := pgxpool.New(ctx, cfg.DatabaseURL)
	if err != nil {
		logger.Error("db connect failed", "err", err)
		os.Exit(1)
	}
	defer pool.Close()

	if err := pool.Ping(ctx); err != nil {
		logger.Error("db ping failed", "err", err)
		os.Exit(1)
	}

	repo := postgres.NewRepository(pool)
	svc := catalog.NewService(repo)

	// gRPC server
	grpcListener, err := net.Listen("tcp", fmt.Sprintf(":%d", cfg.GRPCPort))
	if err != nil {
		logger.Error("grpc listen failed", "err", err)
		os.Exit(1)
	}
	grpcSrv := grpc.NewServer(grpcserver.ServerOptions()...)
	catalogv1.RegisterCatalogServiceServer(grpcSrv, grpcserver.NewCatalogServer(svc))

	go func() {
		logger.Info("gRPC server started", "port", cfg.GRPCPort)
		if err := grpcSrv.Serve(grpcListener); err != nil {
			logger.Error("gRPC server error", "err", err)
		}
	}()

	// HTTP server (health + metrics + REST product API)
	httpSrv := &http.Server{
		Addr:    fmt.Sprintf(":%d", cfg.HTTPPort),
		Handler: rest.NewRouter(logger, svc),
	}

	go func() {
		logger.Info("HTTP server started", "port", cfg.HTTPPort)
		if err := httpSrv.ListenAndServe(); err != nil && err != http.ErrServerClosed {
			logger.Error("HTTP server error", "err", err)
		}
	}()

	<-ctx.Done()
	logger.Info("shutting down")

	grpcSrv.GracefulStop()
	if err := httpSrv.Shutdown(context.Background()); err != nil {
		logger.Error("HTTP shutdown error", "err", err)
	}
}
