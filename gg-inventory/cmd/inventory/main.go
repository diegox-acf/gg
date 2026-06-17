package main

import (
	"context"
	"fmt"
	"log/slog"
	"net/http"
	"os"
	"os/signal"
	"syscall"

	"time"

	"github.com/diegox-acf/gg-inventory/internal/config"
	"github.com/diegox-acf/gg-inventory/internal/events"
	"github.com/diegox-acf/gg-inventory/internal/inventory"
	"github.com/diegox-acf/gg-inventory/internal/observability"
	"github.com/diegox-acf/gg-inventory/internal/postgres"
	"github.com/diegox-acf/gg-inventory/internal/rest"
	"github.com/exaring/otelpgx"
	"github.com/jackc/pgx/v5/pgxpool"
	_ "github.com/joho/godotenv/autoload"
)

func main() {
	cfg, err := config.Load()
	if err != nil {
		slog.Error("config load failed", "err", err)
		os.Exit(1)
	}

	ctx, cancel := signal.NotifyContext(context.Background(), syscall.SIGINT, syscall.SIGTERM)
	defer cancel()

	// Init OTel first so the global LoggerProvider exists before NewLogger wires
	// the slog → OTLP bridge.
	shutdown, err := observability.InitOTel(ctx,
		cfg.OTELEndpoint, cfg.ServiceName, cfg.ServiceVersion, cfg.Environment,
	)
	if err != nil {
		slog.Error("otel init failed", "err", err)
		os.Exit(1)
	}

	logger := observability.NewLogger(cfg.LogLevel)
	slog.SetDefault(logger)

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
	// QueryTracer emits a span per SQL query, auto-parented to the request span —
	// the "→ Postgres" leg of the distributed trace.
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

	repo := postgres.NewRepository(pool, cfg.ReservationTTLMinutes)
	svc := inventory.NewService(repo)

	// Outbox → Kafka relay (Milestone C). Publishes Stock* events written in-tx by the
	// repository; runs until ctx is cancelled.
	publisher, err := events.NewPublisher(cfg.KafkaBrokers)
	if err != nil {
		logger.Error("kafka publisher init failed", "err", err)
		os.Exit(1)
	}
	defer publisher.Close()

	poller := events.NewPoller(
		postgres.NewOutboxRelay(pool),
		publisher,
		logger,
		time.Duration(cfg.OutboxPollIntervalMs)*time.Millisecond,
		cfg.OutboxBatchSize,
	)
	go poller.Run(ctx)

	// Terminal-event consumer (Milestone D): commit/release reservations off
	// OrderConfirmed/OrderFailed.
	consumer, err := events.NewConsumer(
		cfg.KafkaBrokers, cfg.KafkaConsumerGroup, cfg.OrdersTopic,
		svc, postgres.NewConsumedEventStore(pool), logger,
	)
	if err != nil {
		logger.Error("kafka consumer init failed", "err", err)
		os.Exit(1)
	}
	defer consumer.Close()
	go consumer.Run(ctx)

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

	if err := httpSrv.Shutdown(context.Background()); err != nil {
		logger.Error("HTTP shutdown error", "err", err)
	}
}
