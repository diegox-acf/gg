// Package events ships transactional-outbox rows to Kafka (Milestone C). The poller
// drives the relay; the publisher does the actual produce with trace propagation.
package events

import (
	"context"
	"encoding/json"
	"fmt"
	"strconv"
	"time"

	"github.com/diegox-acf/gg-inventory/internal/postgres"
	"github.com/twmb/franz-go/pkg/kgo"
	"go.opentelemetry.io/otel"
	"go.opentelemetry.io/otel/codes"
	"go.opentelemetry.io/otel/propagation"
	"go.opentelemetry.io/otel/trace"
)

// Publisher produces outbox events to Kafka, synchronously (waits for the broker ack so
// the relay only marks a row published on success). acks=all + the idempotent producer
// (franz-go defaults) give the ADR-019 producer durability.
type Publisher struct {
	client     *kgo.Client
	tracer     trace.Tracer
	propagator propagation.TextMapPropagator
}

// envelope is the documented event shape (gg-docs/03-architecture.md). Payload is the
// raw outbox JSON, embedded verbatim.
type envelope struct {
	EventID       string          `json:"event_id"`
	EventType     string          `json:"event_type"`
	Version       int             `json:"version"`
	AggregateType string          `json:"aggregate_type"`
	AggregateID   int64           `json:"aggregate_id"`
	OccurredAt    time.Time       `json:"occurred_at"`
	TraceID       string          `json:"trace_id,omitempty"`
	Payload       json.RawMessage `json:"payload"`
}

// NewPublisher dials the brokers. acks=all is explicit; franz-go enables the idempotent
// producer by default (requires acks=all), preserving per-partition ordering on retries.
func NewPublisher(brokers []string) (*Publisher, error) {
	client, err := kgo.NewClient(
		kgo.SeedBrokers(brokers...),
		kgo.RequiredAcks(kgo.AllISRAcks()),
		kgo.ProducerLinger(5*time.Millisecond),
	)
	if err != nil {
		return nil, fmt.Errorf("create kafka client: %w", err)
	}
	return &Publisher{
		client:     client,
		tracer:     otel.Tracer("gg-inventory"),
		propagator: otel.GetTextMapPropagator(),
	}, nil
}

func (p *Publisher) Close() { p.client.Close() }

// Publish sends one outbox row. It re-establishes the originating span's context from the
// stored traceparent, opens a producer span inside that trace, injects the propagation
// headers, and blocks on the ack.
func (p *Publisher) Publish(ctx context.Context, rec postgres.OutboxRecord) error {
	body, err := json.Marshal(envelope{
		EventID:       rec.EventID,
		EventType:     rec.EventType,
		Version:       1,
		AggregateType: rec.AggregateType,
		AggregateID:   rec.AggregateID,
		OccurredAt:    rec.CreatedAt,
		TraceID:       rec.TraceID,
		Payload:       json.RawMessage(rec.Payload),
	})
	if err != nil {
		return fmt.Errorf("marshal envelope: %w", err)
	}

	// Continue the original trace: extract the stored traceparent, then open a producer
	// span as its child so the Kafka leg shows up in the same Tempo trace.
	parent := p.propagator.Extract(ctx, mapCarrier{"traceparent": rec.TraceParent})
	spanCtx, span := p.tracer.Start(parent, "publish "+rec.Topic, trace.WithSpanKind(trace.SpanKindProducer))
	defer span.End()

	krec := &kgo.Record{
		Topic: rec.Topic,
		Key:   []byte(strconv.FormatInt(rec.AggregateID, 10)), // per-aggregate partition ordering
		Value: body,
	}
	p.propagator.Inject(spanCtx, recordCarrier{krec})

	if err := p.client.ProduceSync(spanCtx, krec).FirstErr(); err != nil {
		span.RecordError(err)
		span.SetStatus(codes.Error, "produce failed")
		return fmt.Errorf("produce to %s: %w", rec.Topic, err)
	}
	return nil
}

// mapCarrier is a read-only TextMapCarrier over a plain map (extract side).
type mapCarrier map[string]string

func (c mapCarrier) Get(key string) string { return c[key] }
func (c mapCarrier) Set(key, val string)   { c[key] = val }
func (c mapCarrier) Keys() []string {
	keys := make([]string, 0, len(c))
	for k := range c {
		keys = append(keys, k)
	}
	return keys
}

// recordCarrier adapts a kgo.Record's headers to a TextMapCarrier (inject side).
type recordCarrier struct{ rec *kgo.Record }

func (c recordCarrier) Get(key string) string {
	for _, h := range c.rec.Headers {
		if h.Key == key {
			return string(h.Value)
		}
	}
	return ""
}

func (c recordCarrier) Set(key, val string) {
	c.rec.Headers = append(c.rec.Headers, kgo.RecordHeader{Key: key, Value: []byte(val)})
}

func (c recordCarrier) Keys() []string {
	keys := make([]string, 0, len(c.rec.Headers))
	for _, h := range c.rec.Headers {
		keys = append(keys, h.Key)
	}
	return keys
}
