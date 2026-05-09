# gg-catalog

Catalog microservice for [GG Gaming](https://gaming.gg). Owns the product and
category data for the storefront. Read-heavy; no inventory counts, no order state.

## Responsibilities

- Serve product listings, detail pages, and category navigation
- Expose a gRPC API consumed by internal services
- Expose a REST API consumed by the Next.js BFF (`gg-storefront`)
- Emit product-change events to Kafka (planned)

## Stack

| Concern | Choice |
|---|---|
| Language | Go 1.22 |
| HTTP router | chi v5 |
| gRPC | grpc-go + protoc-gen-go |
| Database | PostgreSQL 17 via pgx/v5 (no ORM) |
| Migrations | golang-migrate |
| Observability | OpenTelemetry (traces → Tempo, metrics → Prometheus) |
| Logging | log/slog (JSON, structured) |
| Config | caarlos0/env (env-var struct binding) |

## Project layout

```
cmd/catalog/        main — wiring only
internal/
  catalog/          domain: models, repository interface, service
  config/           env-var config
  grpc/             gRPC server (proto ↔ domain)
  rest/             HTTP router, handlers, middleware
  postgres/         pgx repository implementation + SQL queries
  observability/    OTel init, slog logger
gen/catalog/v1/     generated protobuf (do not edit)
proto/catalog/v1/   protobuf source of truth
migrations/         golang-migrate SQL files
docker/             Dockerfile, otel-collector config
```

## API

### REST (`:8080`)

| Method | Path | Description |
|---|---|---|
| `GET` | `/health` | Liveness probe |
| `GET` | `/ready` | Readiness probe |
| `GET` | `/metrics` | Prometheus metrics |
| `GET` | `/v1/categories` | List all categories |
| `GET` | `/v1/products` | List products (supports `category_id`, `page_size`, `page_token`) |
| `GET` | `/v1/products/{id}` | Get product by ID |
| `GET` | `/v1/products/slug/{slug}` | Get product by slug |

Pagination is keyset-based. `next_page_token` in the response is the cursor for
the next page; pass it as `page_token` in the next request.

### gRPC (`:9090`)

Defined in `proto/catalog/v1/catalog.proto`. Methods:

- `ListProducts` — paginated product list with optional category filter
- `GetProduct` — single product by ID
- `GetProductsByIds` — batch fetch by IDs (used by Orders service)
- `ListCategories` — full category list

## Running locally

### Prerequisites

- Go 1.22+
- [`golang-migrate`](https://github.com/golang-migrate/migrate/tree/master/cmd/migrate) CLI
- [`air`](https://github.com/air-verse/air) for hot reload (`go install github.com/air-verse/air@latest`)
- Infra stack running (`docker compose up -d` from `gg-local/`)

### Environment variables

Copy `.env.local` and adjust if needed:

| Variable | Default | Description |
|---|---|---|
| `DATABASE_URL` | _(required)_ | Postgres connection string |
| `HTTP_PORT` | `8080` | REST API port |
| `GRPC_PORT` | `9090` | gRPC server port |
| `OTEL_EXPORTER_OTLP_ENDPOINT` | `localhost:4317` | OTel Collector gRPC endpoint |
| `OTEL_SERVICE_NAME` | `gg-catalog` | Service name in traces |
| `OTEL_SERVICE_VERSION` | `dev` | Service version in traces |
| `DEPLOYMENT_ENVIRONMENT` | `dev` | Environment tag in traces |
| `LOG_LEVEL` | `info` | Log level (`debug`, `info`, `warn`, `error`) |

### Start the service

```bash
# 1. Start infra (from gg-local/)
docker compose up -d

# 2. Run migrations (from gg-catalog/)
make migrate-up

# 3. Start with hot reload
make run

# Or build and run directly
make build && ./bin/catalog
```

### Other make targets

```bash
make test         # run all tests
make lint         # golangci-lint
make proto        # regenerate code from .proto files
make migrate-down # roll back last migration
make docker-build # build Docker image
```

## Observability

| Signal | Where |
|---|---|
| Traces | Grafana Tempo — `localhost:3001` → Explore → Tempo |
| Metrics | Prometheus — `localhost:9090` or via Grafana |
| Logs | Grafana Loki — `localhost:3001` → Explore → Loki |

All traces carry `service.name=gg-catalog`. Filter by this in Tempo to see only
catalog spans. Each HTTP request and gRPC call produces a root span; DB queries
produce child spans.

## Database

Migrations live in `migrations/`. The seed migration (`000002_create_products`)
inserts 8 representative products across 4 categories (GPUs, CPUs, peripherals,
storage) so the storefront renders real data immediately after `make migrate-up`.

Schema:
- `categories` — static reference data (id, slug, label, icon)
- `products` — catalog items with `specs` stored as JSONB
