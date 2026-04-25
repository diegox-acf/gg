# 04 — Scalability and Non-Functional Requirements

> **Context:** This is a learning project, not a production system serving millions. The scalability targets below are **learning targets** — enough to exercise the patterns, not enough to claim production readiness. We'll load-test to these numbers to validate our designs.

## Load targets (MVP)

| Metric | Target | Notes |
|---|---|---|
| Steady-state RPS | 100 req/s across storefront | Browse + API traffic |
| Peak RPS | 500 req/s for 5 minutes | Simulated flash sale |
| Concurrent shoppers | 1,000 | Mix of browsers and checkouts |
| Checkouts per minute | 50 sustained, 200 peak | Where the saga gets exercised |
| Catalog size | 500 products | Plenty to test pagination and search |
| Order history per user | 100 orders max in test data | |

These aren't business ambitions. They're **load test targets** that force the architecture to actually work under stress.

## Latency budgets (p95)

| Operation | Budget | Breakdown |
|---|---|---|
| Product list page (SSR) | 400ms | 200ms catalog + 100ms render + 100ms network |
| Product detail page (SSR) | 300ms | 150ms catalog + 100ms render + 50ms network |
| Add to cart | 150ms | 100ms Redis + 50ms overhead |
| Create order (saga start) | 2s | DB writes + gRPC calls, generous |
| Full checkout (to confirmation) | 5s | Includes Stripe roundtrip |
| Trace ingest to visible in Grafana | 30s | Acceptable for a learning setup |

## Availability targets

| Tier | Target | Why |
|---|---|---|
| Storefront (read path) | 99.9% | User-facing |
| Checkout (write path) | 99.5% | Fewer nines acceptable for learning env |
| Admin/ops | best effort | No target; we're the only operator |

Multi-region DR is explicitly not in scope. Single region with multi-AZ for RDS is our ceiling.

## Scaling strategy per layer

### Frontend (Next.js BFF)
- **Horizontal scaling** via Kubernetes HPA on CPU (70% target) and request rate.
- **Caching:** CloudFront in front of static assets. Server-rendered pages cached for 60s for guest traffic, bypassed for authenticated users.
- **Starting replicas:** 2. HPA min 2, max 10.

### Catalog
- **Horizontal scaling** via HPA. Stateless, scales linearly.
- **Read replicas** on Postgres if reads ever dominate (not needed initially).
- **Caching:** In-memory LRU in the service for hot product lookups (invalidated on product updates via event).
- **Starting replicas:** 2. HPA min 2, max 8.

### Orders
- **Horizontal scaling:** Yes, but the saga orchestrator needs careful handling. Each order's saga is pinned to whatever replica picks it up from the DB (no cross-replica coordination needed — state is in the DB).
- **Database connection pool** is the constraint to watch; tune HikariCP carefully.
- **Starting replicas:** 2. HPA min 2, max 6.

### Inventory
- **Horizontal scaling** via HPA.
- **Hot row contention:** Popular products can have their stock row hammered during flash sales. Mitigation: optimistic locking with retry; Phase 2 consideration is moving to a reservation-counter pattern with eventual reconciliation for truly hot SKUs.
- **Starting replicas:** 2. HPA min 2, max 6.

### Redis (Cart)
- **Vertical scaling** first. A single r6g.large handles all MVP load comfortably.
- **Cluster mode** deferred; single node with replica for HA.

### Postgres (RDS)
- **Vertical scaling** first (t4g.medium → r6g.large as needed).
- **Multi-AZ** for failover.
- **Read replicas** only if a specific read pattern demands it.
- **Connection pooling** via pgbouncer sidecar if connection count becomes a problem.

## Stateless vs stateful

All application services are stateless. State lives in:
- Postgres (durable transactional state)
- Redis (ephemeral session state, safe to lose)
- SQS (in-flight messages)
- S3 (images, invoices)

This means: pod kills are safe, rollouts are safe, and autoscaling is straightforward.

## Event-driven back pressure

- SQS queue depth is a monitored metric. Alert fires at 1000 messages.
- Consumers scale on queue depth (KEDA — consider adding in Phase 2).
- DLQ messages trigger immediate alert; never ignored.

## Rate limiting

- Edge: NGINX Ingress rate limits per-IP (1000 req/min) and per-user (100 req/min for authenticated).
- Service-level: Each gRPC service has a simple token bucket for inbound calls.
- Stripe: Stripe enforces its own rate limits; we respect their retry-after headers.

## Failure isolation

- **Bulkhead pattern:** Per-service connection pools prevent one slow dependency from exhausting resources.
- **Timeouts:** Every external call has an explicit timeout. No unbounded waits.
- **Circuit breakers:** gRPC client middleware opens on error thresholds.
- **Graceful degradation:** If Catalog is down, cart and order history still work; only new browsing fails. If Inventory is down, checkout fails but browsing works.

## Capacity planning (ballpark)

Per 100 req/s steady state, expected resource footprint:

| Service | Replicas | CPU / replica | Memory / replica |
|---|---|---|---|
| BFF | 2 | 250m | 512Mi |
| Catalog | 2 | 200m | 256Mi |
| Orders | 2 | 500m | 1Gi (JVM) |
| Inventory | 2 | 200m | 256Mi |
| Keycloak | 1 | 500m | 1Gi (JVM) |
| Observability stack | — | ~2 CPU | ~4Gi |

Total cluster minimum: roughly 4 vCPU and 8GiB for apps + 2 vCPU and 4GiB for platform. A 3-node m6g.large cluster comfortably fits this with headroom.

## Cost awareness

Scaling decisions must consider cost. The learning-env target is to stay under **~$200/month** running 24/7, assuming we use:

- Spot instances for non-critical node groups
- t4g / r6g instances (Graviton = cheaper)
- Single NAT gateway
- Small RDS instances with gp3 storage
- CloudWatch Logs retention at 7 days
- Delete load test environments after use

Idle-at-night scripts (scale cluster to zero overnight) are tracked as a Phase 0 stretch goal.

## Non-functional requirements summary

| Category | Requirement |
|---|---|
| **Performance** | See latency budgets above |
| **Scalability** | Horizontal scaling via HPA; stateless services; DB-backed state |
| **Availability** | 99.5% for write path, 99.9% for read path (learning targets) |
| **Durability** | RDS multi-AZ, S3 for object storage, outbox pattern for events |
| **Security** | TLS everywhere externally, private subnets, IRSA, Secrets Manager, least-privilege IAM |
| **Observability** | 100% trace sampling in dev; structured logs with trace_id; RED metrics on every service |
| **Maintainability** | Clear service boundaries, Protobuf contracts, ADRs for decisions |
| **Cost** | < $200/month for 24/7 learning env |
| **Developer experience** | Full local stack runnable via `docker compose up`; kind for local K8s |
