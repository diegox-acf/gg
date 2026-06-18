package gg.gaming.orders.common;

import io.opentelemetry.api.trace.Span;

/**
 * Reads the active trace context from the OpenTelemetry API (the Java agent supplies it at runtime)
 * for stamping outbox rows. Returns {@code null} off-agent (e.g. tests) rather than the all-zero
 * invalid id. Reading MDC here does NOT work: the agent's logback-MDC instrumentation only enriches
 * log output, not the live MDC map.
 */
public final class Tracing {

  private Tracing() {}

  /** Trace id (32 hex) of the active span, or {@code null} when none is valid. */
  public static String currentTraceId() {
    var ctx = Span.current().getSpanContext();
    return ctx.isValid() ? ctx.getTraceId() : null;
  }

  /**
   * Full W3C traceparent ({@code 00-<trace>-<span>-<flags>}) of the active span, or {@code null}
   * when none is valid. The full form (with span id) is what the outbox poller needs to
   * re-establish the context and chain the published Kafka span into this trace — trace_id alone is
   * insufficient.
   */
  public static String currentTraceParent() {
    var ctx = Span.current().getSpanContext();
    if (!ctx.isValid()) {
      return null;
    }
    return "00-" + ctx.getTraceId() + "-" + ctx.getSpanId() + "-" + ctx.getTraceFlags().asHex();
  }
}
