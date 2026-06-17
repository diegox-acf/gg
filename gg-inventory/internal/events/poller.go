package events

import (
	"context"
	"log/slog"
	"time"

	"github.com/diegox-acf/gg-inventory/internal/postgres"
)

// Poller drives the outbox relay on a fixed interval. Each tick claims and publishes a
// batch; publish failures are logged and retried next tick (the relay rolls back, so the
// rows stay unpublished).
type Poller struct {
	relay     *postgres.OutboxRelay
	publisher *Publisher
	logger    *slog.Logger
	interval  time.Duration
	batchSize int
}

func NewPoller(
	relay *postgres.OutboxRelay,
	publisher *Publisher,
	logger *slog.Logger,
	interval time.Duration,
	batchSize int,
) *Poller {
	return &Poller{
		relay:     relay,
		publisher: publisher,
		logger:    logger,
		interval:  interval,
		batchSize: batchSize,
	}
}

// Run polls until ctx is cancelled. It drains as long as full batches keep coming, so a
// backlog clears fast without waiting a full interval between batches.
func (p *Poller) Run(ctx context.Context) {
	p.logger.Info("outbox poller started", "interval", p.interval, "batch_size", p.batchSize)
	ticker := time.NewTicker(p.interval)
	defer ticker.Stop()

	for {
		select {
		case <-ctx.Done():
			p.logger.Info("outbox poller stopped")
			return
		case <-ticker.C:
			for {
				n, err := p.relay.Relay(ctx, p.batchSize, p.publisher.Publish)
				if err != nil {
					p.logger.Error("outbox relay failed", "err", err)
					break
				}
				if n > 0 {
					p.logger.Info("published outbox events to Kafka", "count", n)
				}
				if n < p.batchSize {
					break // drained
				}
			}
		}
	}
}
