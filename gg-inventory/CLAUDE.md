# gg-inventory — Claude Code Instructions

> Also read the project-wide CLAUDE.md at `../CLAUDE.md` before working here.
> This service mirrors `gg-catalog`'s layout and conventions; read
> `../gg-catalog/CLAUDE.md` too — only the inventory-specific deltas are below.

## Service role

Stock and reservations for the checkout saga. Owns `stock` and `reservations`
only — never products (Catalog owns those) or orders (Orders owns those). All
cross-domain references are bare `product_id` / `order_id` columns with **no FK**.
Called synchronously by Orders (reserve), and—from a later milestone—commits/
releases in response to `OrderConfirmed`/`OrderFailed` Kafka events.

## Package layout

```
cmd/inventory/       entry point — wiring only, no business logic
internal/
  inventory/         domain: model.go, errors.go, repository.go (port), service.go
  config/            env-var config struct (caarlos0/env)
  rest/              HTTP adapter (chi router, handlers, middleware)
  postgres/          repository implementation (pgx, raw SQL, transactions)
  observability/     OTel init, slog logger
  events/            (later milestone) Kafka outbox poller + consumers
migrations/          golang-migrate SQL files
```

Dependency direction is strict: `rest/ → inventory/ → postgres/` via the
`inventory.Repository` port. Nothing in `inventory/` imports `postgres/` or `rest/`.

## Concurrency — optimistic locking (the core learning goal)

Stock is mutated only through `postgres.applyStockDelta`: read `version`, then a
compare-and-swap `UPDATE ... WHERE version = $expected`. A 0-row result means a
concurrent writer bumped the version → re-read and retry (bounded by
`maxCASAttempts`). A would-be negative balance returns `ErrInsufficientStock`
**without** retrying. The CHECK constraints (`available >= 0`, `reserved >= 0`)
are a second line of defence. Never use `SELECT ... FOR UPDATE`.

## Transactions & outbox

Reserve/Commit/Release each run in a single `pgx` transaction that mutates stock,
writes the reservation row, AND appends the outbox event — atomically (ADR-006,
no exceptions). The transaction boundary lives in the `postgres` adapter; domain
rules (validation, state transitions) live in `inventory/service.go`.

## Idempotency

Reserve is idempotent on the request `idempotency_key`. Each reservation row's
`idempotency_key` is derived as `<requestKey>:<product_id>` (keeps the per-row
UNIQUE constraint while making the whole multi-item request replayable). Commit/
release are idempotent: re-applying the target state is a no-op success.

## REST API

- `GET  /v1/stock/{product_id}`
- `POST /v1/reservations`                          `{order_id, items[], idempotency_key}`
- `POST /v1/reservations/{reservation_id}/commit`
- `POST /v1/reservations/{reservation_id}/release`
- `GET  /health`, `GET /ready`, `GET /metrics`

An `Idempotency-Key` header, if present, overrides the body's `idempotency_key`.
Domain errors map to status codes in `rest.writeDomainError`.

## Migrations

`golang-migrate` naming (`NNNNNN_description.up/down.sql`), `CREATE ... IF NOT
EXISTS`, seeds via `ON CONFLICT DO NOTHING`. Never edit an applied migration —
add a new one. Stock is seeded over a generous product-id range because Inventory
can't see the catalog's ids (private DBs) and the catalog id sequence isn't reset
on reseed.

## Observability

Tracer name `gg-inventory` everywhere (it becomes the Tempo service name). OTel
HTTP middleware wraps the whole chi router; the `otelpgx` query tracer on the pool
adds the Postgres span leg. Outbox rows carry the request `trace_id` for later
trace↔event correlation.

## Dev

- `make run` (air hot-reload) or `make build && ./bin/inventory`.
- `make migrate-up` against `postgres-inventory` (host port 5434).
- Requires the `gg-local` stack up (at least `postgres-inventory`, `otel-collector`).
