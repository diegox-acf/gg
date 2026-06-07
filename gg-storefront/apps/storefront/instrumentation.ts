// OpenTelemetry registration for the storefront BFF. Next.js loads this file
// automatically (the `register` export runs once, before any request).
//
// This is what makes the browser → BFF → Catalog → Postgres trace a single
// connected flow: registering OTel turns on Next's automatic spans for incoming
// requests, route rendering, and server-side `fetch`. The fetch instrumentation
// injects the W3C `traceparent` header on the outgoing call to gg-catalog, whose
// otelhttp middleware extracts it and parents its spans (and the Postgres span)
// to ours. All spans land in the same collector → Tempo as the Go service.
import { registerOTel } from "@vercel/otel";

export function register() {
  registerOTel({
    serviceName: process.env.OTEL_SERVICE_NAME ?? "gg-storefront-bff",
    // Exports OTLP/HTTP to the collector. Honors OTEL_EXPORTER_OTLP_ENDPOINT
    // (set to http://localhost:4318 in dev); the exporter appends /v1/traces.
  });
}
