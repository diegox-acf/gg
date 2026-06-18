package inventory

import (
	"context"
	"log/slog"
	"time"
)

// Sweeper periodically expires reservations left RESERVED past their TTL — the inventory-side
// safety net (D3) for an order whose saga crashed and never sent a terminal commit/release. It
// drains in full batches so a backlog clears without waiting a whole interval.
type Sweeper struct {
	svc       *Service
	logger    *slog.Logger
	interval  time.Duration
	batchSize int
}

func NewSweeper(svc *Service, logger *slog.Logger, interval time.Duration, batchSize int) *Sweeper {
	return &Sweeper{svc: svc, logger: logger, interval: interval, batchSize: batchSize}
}

// Run sweeps until ctx is cancelled.
func (s *Sweeper) Run(ctx context.Context) {
	s.logger.Info("reservation sweeper started", "interval", s.interval, "batch_size", s.batchSize)
	ticker := time.NewTicker(s.interval)
	defer ticker.Stop()

	for {
		select {
		case <-ctx.Done():
			s.logger.Info("reservation sweeper stopped")
			return
		case <-ticker.C:
			for {
				n, err := s.svc.SweepExpiredReservations(ctx, s.batchSize)
				if err != nil {
					s.logger.Error("reservation sweep failed", "err", err)
					break
				}
				if n > 0 {
					s.logger.Info("expired stale reservations", "count", n)
				}
				if n < s.batchSize {
					break // drained
				}
			}
		}
	}
}
