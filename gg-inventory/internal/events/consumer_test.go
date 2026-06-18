package events

import (
	"context"
	"fmt"
	"log/slog"
	"testing"
	"time"

	"github.com/diegox-acf/gg-inventory/internal/inventory"
	"github.com/diegox-acf/gg-inventory/internal/postgres"
	"github.com/jackc/pgx/v5/pgxpool"
	"github.com/stretchr/testify/require"
	"github.com/twmb/franz-go/pkg/kadm"
	"github.com/twmb/franz-go/pkg/kgo"
)

const ordersTopic = "orders.order-created"

// TestConsumerCommitsReleasesDedupsAndDlqs drives the terminal-event consumer end to end against a
// real Kafka: OrderConfirmed commits a reservation, a redelivery is deduped, and a poison record is
// routed to the DLQ.
func TestConsumerCommitsReleasesDedupsAndDlqs(t *testing.T) {
	if testing.Short() {
		t.Skip("integration test requires Docker; skipped in -short mode")
	}
	ctx := context.Background()
	pool := setupPostgres(t, ctx)
	brokers := setupKafka(t, ctx)
	createTopics(t, brokers, ordersTopic, ordersTopic+".dlq")

	repo := postgres.NewRepository(pool, 15)
	svc := inventory.NewService(repo)

	// Seed a RESERVED reservation for order 555 (product 1, qty 2).
	_, err := svc.Reserve(ctx, inventory.ReserveRequest{
		OrderID:        555,
		IdempotencyKey: "order-555",
		Items:          []inventory.ReservationItem{{ProductID: 1, Quantity: 2}},
	})
	require.NoError(t, err)

	consumer, err := NewConsumer(
		brokers, "gg-inventory-test", ordersTopic,
		svc, postgres.NewConsumedEventStore(pool), slog.Default(),
	)
	require.NoError(t, err)
	t.Cleanup(consumer.Close)

	runCtx, cancel := context.WithCancel(ctx)
	t.Cleanup(cancel)
	go consumer.Run(runCtx)

	producer, err := kgo.NewClient(kgo.SeedBrokers(brokers...))
	require.NoError(t, err)
	t.Cleanup(producer.Close)

	// OrderConfirmed → the reservation is committed.
	confirmEventID := "11111111-1111-1111-1111-111111111111"
	produce(t, ctx, producer, ordersTopic, "555", orderEvent(confirmEventID, "OrderConfirmed", 555))
	require.Eventually(t, func() bool {
		return reservationStatus(t, ctx, pool, 555) == "COMMITTED"
	}, 30*time.Second, 200*time.Millisecond, "reservation should be committed")

	// Re-delivery of the same event_id is deduped — still exactly one consumed_events row.
	produce(t, ctx, producer, ordersTopic, "555", orderEvent(confirmEventID, "OrderConfirmed", 555))
	time.Sleep(2 * time.Second)
	require.Equal(t, int64(1), consumedCount(t, ctx, pool))

	// Poison record → routed to the DLQ.
	produce(t, ctx, producer, ordersTopic, "555", []byte("not-json"))
	dlq := consumeFrom(t, brokers, ordersTopic+".dlq")
	require.Equal(t, "not-json", string(dlq.Value))
}

func createTopics(t *testing.T, brokers []string, topics ...string) {
	t.Helper()
	admClient, err := kgo.NewClient(kgo.SeedBrokers(brokers...))
	require.NoError(t, err)
	defer admClient.Close()
	for _, topic := range topics {
		_, err := kadm.NewClient(admClient).CreateTopics(context.Background(), 1, 1, nil, topic)
		require.NoError(t, err)
	}
}

func produce(t *testing.T, ctx context.Context, cl *kgo.Client, topic, key string, value []byte) {
	t.Helper()
	rec := &kgo.Record{Topic: topic, Key: []byte(key), Value: value}
	require.NoError(t, cl.ProduceSync(ctx, rec).FirstErr())
}

func consumeFrom(t *testing.T, brokers []string, topic string) *kgo.Record {
	t.Helper()
	cl, err := kgo.NewClient(
		kgo.SeedBrokers(brokers...),
		kgo.ConsumeTopics(topic),
		kgo.ConsumeResetOffset(kgo.NewOffset().AtStart()),
	)
	require.NoError(t, err)
	t.Cleanup(cl.Close)
	pollCtx, cancel := context.WithTimeout(context.Background(), 30*time.Second)
	defer cancel()
	fetches := cl.PollFetches(pollCtx)
	require.NoError(t, fetches.Err())
	records := fetches.Records()
	require.NotEmpty(t, records)
	return records[0]
}

func orderEvent(eventID, eventType string, orderID int64) []byte {
	return fmt.Appendf(nil,
		`{"event_id":%q,"event_type":%q,"version":1,"aggregate_type":"Order","aggregate_id":%d,`+
			`"payload":{"order_id":%d}}`, eventID, eventType, orderID, orderID)
}

func reservationStatus(t *testing.T, ctx context.Context, pool *pgxpool.Pool, orderID int64) string {
	t.Helper()
	var status string
	err := pool.QueryRow(ctx, "SELECT status FROM reservations WHERE order_id=$1", orderID).Scan(&status)
	require.NoError(t, err)
	return status
}

func consumedCount(t *testing.T, ctx context.Context, pool *pgxpool.Pool) int64 {
	t.Helper()
	var n int64
	require.NoError(t, pool.QueryRow(ctx, "SELECT COUNT(*) FROM consumed_events").Scan(&n))
	return n
}
