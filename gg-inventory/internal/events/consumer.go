package events

import (
	"context"
	"encoding/json"
	"errors"
	"fmt"
	"log/slog"
	"time"

	"github.com/twmb/franz-go/pkg/kgo"
	"go.opentelemetry.io/otel"
	"go.opentelemetry.io/otel/propagation"
	"go.opentelemetry.io/otel/trace"
)

const (
	eventOrderConfirmed = "OrderConfirmed"
	eventOrderFailed    = "OrderFailed"

	maxRetries   = 3
	retryBackoff = 500 * time.Millisecond
)

// errNonRetryable marks a poison record (e.g. a malformed envelope) that should go straight to the
// DLQ rather than being retried.
var errNonRetryable = errors.New("non-retryable")

// Handler applies a terminal order event to inventory state.
type Handler interface {
	CommitOrder(ctx context.Context, orderID int64) error
	ReleaseOrder(ctx context.Context, orderID int64) error
}

// DedupStore records/queries processed event ids for consumer-side idempotency.
type DedupStore interface {
	IsConsumed(ctx context.Context, eventID string) (bool, error)
	MarkConsumed(ctx context.Context, eventID, consumerGroup, topic string) error
}

// incoming is the subset of the event envelope the consumer needs.
type incoming struct {
	EventID     string `json:"event_id"`
	EventType   string `json:"event_type"`
	AggregateID int64  `json:"aggregate_id"` // the order id
}

// Consumer reads terminal order events from orders.order-created and commits/releases the order's
// reservations. Effectively-once (ADR-019): manual offset commit (commit only after processing),
// dedup by event_id, and idempotent commit/release as the safety net. A record that still fails
// after retries — or is unparseable — is routed to <topic>.dlq.
type Consumer struct {
	client     *kgo.Client
	handler    Handler
	dedup      DedupStore
	group      string
	topic      string
	dlqTopic   string
	logger     *slog.Logger
	propagator propagation.TextMapPropagator
	tracer     trace.Tracer
}

// NewConsumer joins the consumer group. Auto-commit is off (we commit per record after handling);
// read_committed since the platform publishes no Kafka transactions but it is the correct default.
func NewConsumer(
	brokers []string,
	group, topic string,
	handler Handler,
	dedup DedupStore,
	logger *slog.Logger,
) (*Consumer, error) {
	client, err := kgo.NewClient(
		kgo.SeedBrokers(brokers...),
		kgo.ConsumerGroup(group),
		kgo.ConsumeTopics(topic),
		kgo.DisableAutoCommit(),
		kgo.FetchIsolationLevel(kgo.ReadCommitted()),
	)
	if err != nil {
		return nil, fmt.Errorf("create consumer client: %w", err)
	}
	return &Consumer{
		client:     client,
		handler:    handler,
		dedup:      dedup,
		group:      group,
		topic:      topic,
		dlqTopic:   topic + ".dlq",
		logger:     logger,
		propagator: otel.GetTextMapPropagator(),
		tracer:     otel.Tracer("gg-inventory"),
	}, nil
}

func (c *Consumer) Close() { c.client.Close() }

// Run polls until ctx is cancelled, handling each record and committing its offset afterward.
func (c *Consumer) Run(ctx context.Context) {
	c.logger.Info("orders consumer started", "group", c.group, "topic", c.topic)
	for {
		fetches := c.client.PollFetches(ctx)
		if fetches.IsClientClosed() || ctx.Err() != nil {
			c.logger.Info("orders consumer stopped")
			return
		}
		fetches.EachError(func(t string, p int32, err error) {
			c.logger.Error("fetch error", "topic", t, "partition", p, "err", err)
		})
		fetches.EachRecord(func(rec *kgo.Record) { c.handle(ctx, rec) })
	}
}

func (c *Consumer) handle(ctx context.Context, rec *kgo.Record) {
	if err := c.processWithRetries(ctx, rec); err != nil {
		c.logger.Error("routing record to DLQ", "offset", rec.Offset, "err", err)
		c.toDLQ(ctx, rec)
	}
	// Commit the offset whether the record was processed, ignored, or DLQ'd — only an
	// unrecovered failure leaves it uncommitted (so it is re-delivered).
	if err := c.client.CommitRecords(ctx, rec); err != nil {
		c.logger.Error("offset commit failed", "offset", rec.Offset, "err", err)
	}
}

func (c *Consumer) processWithRetries(ctx context.Context, rec *kgo.Record) error {
	var err error
	for attempt := 0; attempt <= maxRetries; attempt++ {
		if attempt > 0 {
			time.Sleep(retryBackoff)
		}
		err = c.process(ctx, rec)
		if err == nil || errors.Is(err, errNonRetryable) {
			return err
		}
		c.logger.Warn("processing failed, will retry", "attempt", attempt+1, "err", err)
	}
	return err
}

func (c *Consumer) process(ctx context.Context, rec *kgo.Record) error {
	// Continue the producer's trace from the Kafka headers.
	ctx = c.propagator.Extract(ctx, recordCarrier{rec})
	ctx, span := c.tracer.Start(ctx, "consume "+rec.Topic, trace.WithSpanKind(trace.SpanKindConsumer))
	defer span.End()

	var env incoming
	if err := json.Unmarshal(rec.Value, &env); err != nil {
		return fmt.Errorf("%w: bad envelope: %v", errNonRetryable, err)
	}
	if env.EventType != eventOrderConfirmed && env.EventType != eventOrderFailed {
		return nil // OrderPlaced and other types are not actioned here
	}
	if env.EventID == "" || env.AggregateID <= 0 {
		return fmt.Errorf("%w: missing event_id or aggregate_id", errNonRetryable)
	}

	consumed, err := c.dedup.IsConsumed(ctx, env.EventID)
	if err != nil {
		return fmt.Errorf("dedup check: %w", err)
	}
	if consumed {
		c.logger.Debug("duplicate event, skipping", "event_id", env.EventID)
		return nil
	}

	switch env.EventType {
	case eventOrderConfirmed:
		err = c.handler.CommitOrder(ctx, env.AggregateID)
	case eventOrderFailed:
		err = c.handler.ReleaseOrder(ctx, env.AggregateID)
	}
	if err != nil {
		return fmt.Errorf("apply %s for order %d: %w", env.EventType, env.AggregateID, err)
	}

	c.logger.Info("applied terminal event",
		"event_type", env.EventType, "order_id", env.AggregateID, "event_id", env.EventID)
	return c.dedup.MarkConsumed(ctx, env.EventID, c.group, rec.Topic)
}

func (c *Consumer) toDLQ(ctx context.Context, rec *kgo.Record) {
	dlq := &kgo.Record{Topic: c.dlqTopic, Key: rec.Key, Value: rec.Value, Headers: rec.Headers}
	if err := c.client.ProduceSync(ctx, dlq).FirstErr(); err != nil {
		c.logger.Error("failed to publish to DLQ", "topic", c.dlqTopic, "err", err)
	}
}
