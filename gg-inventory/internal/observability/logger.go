package observability

import (
	"context"
	"errors"
	"log/slog"
	"os"

	"go.opentelemetry.io/contrib/bridges/otelslog"
)

// NewLogger returns a slog.Logger that writes to BOTH stdout (JSON, for dev /
// `docker logs`) and the OTel log bridge (→ global LoggerProvider → OTLP →
// collector → Loki). Call InitOTel first so the LoggerProvider is set.
func NewLogger(level string) *slog.Logger {
	var l slog.Level
	switch level {
	case "debug":
		l = slog.LevelDebug
	case "warn":
		l = slog.LevelWarn
	case "error":
		l = slog.LevelError
	default:
		l = slog.LevelInfo
	}

	stdout := slog.NewJSONHandler(os.Stdout, &slog.HandlerOptions{Level: l})
	// otelslog reads the active span from each record's context and stamps
	// trace_id/span_id onto the exported log, enabling trace↔log correlation.
	otelHandler := otelslog.NewHandler("gg-inventory")

	return slog.New(newFanoutHandler(stdout, otelHandler))
}

// fanoutHandler dispatches each record to every wrapped handler.
type fanoutHandler struct {
	handlers []slog.Handler
}

func newFanoutHandler(h ...slog.Handler) *fanoutHandler {
	return &fanoutHandler{handlers: h}
}

func (f *fanoutHandler) Enabled(ctx context.Context, level slog.Level) bool {
	for _, h := range f.handlers {
		if h.Enabled(ctx, level) {
			return true
		}
	}
	return false
}

func (f *fanoutHandler) Handle(ctx context.Context, r slog.Record) error {
	var errs []error
	for _, h := range f.handlers {
		if h.Enabled(ctx, r.Level) {
			if err := h.Handle(ctx, r.Clone()); err != nil {
				errs = append(errs, err)
			}
		}
	}
	return errors.Join(errs...)
}

func (f *fanoutHandler) WithAttrs(attrs []slog.Attr) slog.Handler {
	next := make([]slog.Handler, len(f.handlers))
	for i, h := range f.handlers {
		next[i] = h.WithAttrs(attrs)
	}
	return &fanoutHandler{handlers: next}
}

func (f *fanoutHandler) WithGroup(name string) slog.Handler {
	next := make([]slog.Handler, len(f.handlers))
	for i, h := range f.handlers {
		next[i] = h.WithGroup(name)
	}
	return &fanoutHandler{handlers: next}
}
