# gg-orders — Claude Code Instructions

> Also read the project-wide CLAUDE.md at `../CLAUDE.md` before working here.
> This is the **saga orchestrator** (ADR-018). It owns the checkout lifecycle and
> drives Inventory + Stripe. Read `../gg-docs/02-business-logic.md` (UC-05),
> `../gg-docs/03-architecture.md` (saga), and `../gg-docs/09-data-model.md` (schema).
> Stack: **Spring Boot 3.5.x / Java 21** (chosen over Boot 4 for mature Kafka/Stripe/
> OTel ecosystem support on the saga milestones).

## Service role

Owns orders, line items, payments — never products (Catalog owns those) or stock
(Inventory owns that). Cross-domain references (`user_id`, `product_id`) are bare
ids with **no FK**. Drives the saga: creates a `PENDING` order, reserves stock via
**synchronous REST** to Inventory, pays via Stripe, then emits terminal
`OrderConfirmed`/`OrderFailed` events on Kafka (Inventory commits/releases off those).

## Stack

Spring Boot **3.5.x** / Java **21**, Gradle (Kotlin DSL), Spring Data JPA + **Flyway**
(`src/main/resources/db/migration`, `V{n}__desc.sql`), `RestClient` for sync HTTP,
virtual threads on (`spring.threads.virtual.enabled=true`). Observability via the
**OpenTelemetry Java agent** (`-javaagent`, auto-instruments MVC/JDBC/RestClient) →
OTLP collector. JSON logs via `logstash-logback-encoder` with MDC `trace_id`/`order_id`.
Code style: **Spotless + Google Java Format** (`./gradlew spotlessApply`).

## Intended package layout (`gg.gaming.orders`)

```
.                  GgOrdersApplication (wiring only)
config/            @ConfigurationProperties, RestClient + bean config
order/             domain: Order/OrderLineItem entities, repositories, OrderService
order/web/         REST adapter: controllers, request/response DTOs
catalog/           RestClient adapter to Catalog (price re-fetch at order creation)
payment/           Stripe integration + webhook handler (Milestone D)
outbox/            outbox entity + scheduled Kafka publisher (Milestone C)
saga/              orchestrator state machine + recovery worker (Milestone D)
common/            Money value object, OrderStatus, shared types
```

Keep controllers thin: no business rules in `@RestController`. Validation and the
`OrderStatus` state machine live in the service layer.

## Money

**Never `double`/`float`.** Persist `BIGINT` cents; in Java use a `Money` value object
over `BigDecimal` (or pass cents as `long`). `total = subtotal + tax + shipping`,
stored explicitly, never recomputed after creation. Tax 8% (`tax-bps: 800`),
flat shipping $9.99 (`shipping-cents: 999`) — see `application.yml`.

## Order creation (POST /orders)

Idempotent on `Idempotency-Key` (see `idempotency_keys` table, 24h TTL). Re-fetch
**authoritative** prices from Catalog `GET /products?ids=` — never trust client prices.
Snapshot `sku`, `name`, `unit_price_cents` onto line items. Write `Order(PENDING)` +
line items + an `OrderPlaced` outbox row in **one** `@Transactional`. Order number
format `GMR-YYYY-NNNNN` (PD-06).

## Transactions & outbox

ADR-006, no exceptions: every state change that must produce an event writes the
`outbox` row in the same transaction. The scheduled poller (Milestone C) publishes
`WHERE published_at IS NULL` to Kafka with a W3C `traceparent` header, then marks it
published. Consumers dedup by `event_id`; DLQ after 3 retries.

## Ports

HTTP **8083** (Catalog 8080, Keycloak 8081, Inventory 8082 are taken). DB
`postgres-orders` — host **5433**, in-container 5432. Flyway auto-migrates on startup.

## Dev

- `./gradlew bootRun` (needs `gg-local` up: at least `postgres-orders`, `otel-collector`).
- `./gradlew build` runs Spotless + tests; tests use Testcontainers Postgres
  (`TestcontainersConfiguration`) — no external DB needed, no DB mocking.
- `make orders-build` / `make orders-test` from the repo root.

## What NOT to do

- No Kafka publishing or Stripe calls in Milestone B — scaffold + create-order only.
- No business logic in `GgOrdersApplication`.
- Don't recompute prices or totals from client input. Catalog is authoritative.
- Never edit an applied Flyway migration — add `V{n+1}__...`.
