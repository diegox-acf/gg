package events

import (
	"context"
	"encoding/json"
	"os"
	"path/filepath"
	"testing"
	"time"

	"github.com/diegox-acf/gg-inventory/internal/inventory"
	"github.com/diegox-acf/gg-inventory/internal/postgres"
	"github.com/jackc/pgx/v5/pgxpool"
	"github.com/stretchr/testify/require"
	"github.com/testcontainers/testcontainers-go"
	tckafka "github.com/testcontainers/testcontainers-go/modules/kafka"
	tcpostgres "github.com/testcontainers/testcontainers-go/modules/postgres"
	"github.com/testcontainers/testcontainers-go/wait"
	"github.com/twmb/franz-go/pkg/kadm"
	"github.com/twmb/franz-go/pkg/kgo"
)

// TestRelayPublishesOutboxToKafka exercises the real path: a Reserve writes a
// StockReserved outbox row, the relay publishes it via the Publisher, the event lands on
// the topic as the documented envelope, and the row is stamped published.
func TestRelayPublishesOutboxToKafka(t *testing.T) {
	if testing.Short() {
		t.Skip("integration test requires Docker; skipped in -short mode")
	}
	ctx := context.Background()
	pool := setupPostgres(t, ctx)
	brokers := setupKafka(t, ctx)

	repo := postgres.NewRepository(pool, 15)
	relay := postgres.NewOutboxRelay(pool)
	publisher, err := NewPublisher(brokers)
	require.NoError(t, err)
	t.Cleanup(publisher.Close)

	// Write a StockReserved outbox row (in the same tx as the reservation).
	_, err = repo.Reserve(ctx, inventory.ReserveRequest{
		OrderID:        77,
		IdempotencyKey: "evt-key",
		Items:          []inventory.ReservationItem{{ProductID: 1, Quantity: 2}},
	})
	require.NoError(t, err)

	// Relay the batch once; expect exactly the one outbox row published.
	n, err := relay.Relay(ctx, 100, publisher.Publish)
	require.NoError(t, err)
	require.Equal(t, 1, n)

	// The event is on the topic, shaped as the documented envelope.
	rec := consumeOne(t, brokers, "inventory.stock-reserved")
	require.Equal(t, "1", string(rec.Key)) // aggregate id (reservation row id)
	var env struct {
		EventType     string `json:"event_type"`
		AggregateType string `json:"aggregate_type"`
		Version       int    `json:"version"`
		Payload       struct {
			ProductID int64  `json:"product_id"`
			Status    string `json:"status"`
		} `json:"payload"`
	}
	require.NoError(t, json.Unmarshal(rec.Value, &env))
	require.Equal(t, "StockReserved", env.EventType)
	require.Equal(t, "Reservation", env.AggregateType)
	require.Equal(t, 1, env.Version)
	require.Equal(t, int64(1), env.Payload.ProductID)
	require.Equal(t, "RESERVED", env.Payload.Status)

	// The row is marked published — a second relay finds nothing.
	n, err = relay.Relay(ctx, 100, publisher.Publish)
	require.NoError(t, err)
	require.Equal(t, 0, n)
}

func setupPostgres(t *testing.T, ctx context.Context) *pgxpool.Pool {
	t.Helper()
	container, err := tcpostgres.Run(ctx, "postgres:17-alpine",
		tcpostgres.WithDatabase("gg_inventory"),
		tcpostgres.WithUsername("postgres"),
		tcpostgres.WithPassword("postgres"),
		testcontainers.WithWaitStrategy(
			wait.ForListeningPort("5432/tcp").WithStartupTimeout(60*time.Second),
		),
	)
	require.NoError(t, err)
	t.Cleanup(func() { _ = container.Terminate(ctx) })

	connStr, err := container.ConnectionString(ctx, "sslmode=disable")
	require.NoError(t, err)
	pool, err := pgxpool.New(ctx, connStr)
	require.NoError(t, err)
	t.Cleanup(pool.Close)

	for _, f := range []string{
		"000001_create_stock.up.sql",
		"000002_create_reservations.up.sql",
		"000003_create_outbox.up.sql",
		"000004_outbox_traceparent.up.sql",
		"000005_consumed_events.up.sql",
	} {
		sql, err := os.ReadFile(filepath.Join("..", "..", "migrations", f))
		require.NoError(t, err)
		_, err = pool.Exec(ctx, string(sql))
		require.NoError(t, err)
	}
	_, err = pool.Exec(ctx, "INSERT INTO stock (product_id, available, reserved) VALUES (1,5,0)")
	require.NoError(t, err)
	return pool
}

func setupKafka(t *testing.T, ctx context.Context) []string {
	t.Helper()
	// confluent-local is the KRaft single-node image the testcontainers-go kafka module is
	// built around; the apache/kafka image trips the module's startup hook (exit 127). The
	// broker behaviour we exercise (produce/consume) is identical.
	container, err := tckafka.Run(ctx, "confluentinc/confluent-local:7.6.1")
	require.NoError(t, err)
	t.Cleanup(func() { _ = container.Terminate(ctx) })
	brokers, err := container.Brokers(ctx)
	require.NoError(t, err)

	// Pre-create the topic, mirroring production where kafka-init provisions topics and
	// the broker's auto-create is off (the publisher never auto-creates).
	admClient, err := kgo.NewClient(kgo.SeedBrokers(brokers...))
	require.NoError(t, err)
	defer admClient.Close()
	_, err = kadm.NewClient(admClient).CreateTopics(ctx, 3, 1, nil, "inventory.stock-reserved")
	require.NoError(t, err)

	return brokers
}

func consumeOne(t *testing.T, brokers []string, topic string) *kgo.Record {
	t.Helper()
	cl, err := kgo.NewClient(
		kgo.SeedBrokers(brokers...),
		kgo.ConsumeTopics(topic),
		kgo.ConsumeResetOffset(kgo.NewOffset().AtStart()),
	)
	require.NoError(t, err)
	t.Cleanup(cl.Close)

	pollCtx, cancel := context.WithTimeout(context.Background(), 20*time.Second)
	defer cancel()
	fetches := cl.PollFetches(pollCtx)
	require.NoError(t, fetches.Err())
	records := fetches.Records()
	require.NotEmpty(t, records)
	return records[0]
}
