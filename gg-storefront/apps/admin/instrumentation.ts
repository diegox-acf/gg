// OpenTelemetry registration for the admin BFF. Next.js runs `register` once before
// any request, turning on automatic spans for requests, rendering, and server-side
// `fetch` — so admin → backend service calls join the same Tempo traces.
import { registerOTel } from "@vercel/otel";

export function register() {
  registerOTel({
    serviceName: process.env.OTEL_SERVICE_NAME ?? "gg-admin-bff",
  });
}
