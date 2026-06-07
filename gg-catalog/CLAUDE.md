# gg-catalog — Claude Code Instructions

> Also read the project-wide CLAUDE.md at `../CLAUDE.md` before working here.
> This file adds catalog-specific conventions on top of the project-wide ones.

## Service role

Read-heavy catalog service. Owns products and categories only — never inventory
counts, never order state. Any cross-domain data goes over REST or Kafka, never
via shared DB.

## Package layout

```
cmd/catalog/       entry point — wiring only, no business logic
internal/
  catalog/         domain layer: model.go, repository.go (interface), service.go
  config/          env-var config struct (caarlos0/env)
  rest/            HTTP adapter (chi router, handlers, middleware)
  postgres/        repository implementation (pgx, raw SQL)
  observability/   OTel init, slog logger
migrations/        golang-migrate SQL files
```

The dependency direction is strict:
`rest/` → `catalog/` → `postgres/` adapter via `catalog.Repository` interface.
Nothing in `catalog/` imports `postgres/` or `rest/`.

## Domain layer rules

- `model.go` holds plain Go structs only — no db tags.
- `repository.go` is the port interface. The `postgres` package is the only adapter.
- `service.go` contains all business rules. Handlers contain none.
- Input validation (non-zero IDs, non-empty slugs) lives in the service, not in
  the handler.

## REST adapter (`internal/rest/`)

- Route functions return `http.HandlerFunc` closures that close over `*catalog.Service`.
- `writeJSON` / `writeError` are the only ways to write responses.
- Query param parsing and path param extraction belong in the handler; the service
  never sees `*http.Request`.
- `readyHandler` returns 200 only if the service is ready to serve. If you add a
  DB liveness check, put it here, not in `healthHandler`.

## Database (`internal/postgres/`)

- Raw SQL only — no ORM. Queries live in `queries.go` as package-level `const` strings.
- Use `pgxpool.Pool`; never hold a single connection.
- Pagination uses keyset (cursor) pagination via the product `id` column, not OFFSET.
  `ListProducts` fetches `PageSize+1` rows and sets `next_page_token` to the last
  item's ID if the extra row was returned.
- Scan order in `rows.Scan(...)` must exactly match `SELECT` column order in the query.

## Migrations

- Files follow `golang-migrate` naming: `NNNNNN_description.up.sql` / `.down.sql`.
- `up.sql` uses `CREATE TABLE IF NOT EXISTS` and `CREATE INDEX IF NOT EXISTS` so
  reruns are safe.
- Seed data goes in the migration that creates the table it belongs to.
  Use `ON CONFLICT ... DO NOTHING` for idempotent seeds.
- Never edit a migration that has been applied. Add a new one instead.

## Observability

- Every span is created with `otel.Tracer("gg-catalog")`. Use the same tracer name
  everywhere — it becomes the service name in Tempo.
- Inject `trace_id` and `span_id` into `slog` log lines at the boundary (see
  `internal/rest/middleware.go`). Do not manually build the correlation in business
  code.
- OTel HTTP middleware wraps the entire chi router; do not add per-handler tracing
  unless you need a child span for a specific operation.
- When adding a new DB query, wrap the `pool.Query` call in a span:
  `ctx, span := tracer.Start(ctx, "db.list_products"); defer span.End()`.

## Configuration

- All config is in `internal/config/Config`. Add new env vars there — never use
  `os.Getenv` directly.
- Required vars use the `required:"true"` tag; the process exits on startup if they
  are missing. This is intentional.

## Error handling

- Wrap errors with `fmt.Errorf("context: %w", err)` at every layer boundary.
- The service layer unwraps `pgx.ErrNoRows` where appropriate; callers should not
  need to import pgx to handle not-found.
- Do not swallow errors; do not log and return simultaneously (log OR return the
  error, not both).

## Testing conventions

- Unit tests live next to the package they test (`_test.go` in the same directory).
- Integration tests use `testcontainers-go` to spin up a real Postgres instance.
  No mocking the database driver.
- Test the `catalog.Service` through its public methods; test `postgres.Repository`
  via integration tests against a real DB.
- Use `testify/assert` and `testify/require` — `require` for fatal assertions
  (stops the test on failure), `assert` for non-fatal ones.

## What NOT to add here

- Cache-aside (in-memory LRU) is planned but not yet implemented. When you add it,
  it belongs in `internal/cache/` and is injected into `catalog.Service` as an
  interface, not hardcoded.
- Kafka publishing belongs in a future `internal/events/` package, not in the
  service or repository.
- No business logic in `cmd/catalog/main.go` — wiring and startup only.
