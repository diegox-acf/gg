# 01 — Tech Stack

Every choice below has a rationale. Where alternatives were seriously considered, the rejection reason is captured in doc 06 (Decision Log). This doc is the "what"; the decision log is the "why not something else".

## Frontend

| Concern | Choice |
|---|---|
| Framework | Next.js 15 (App Router) |
| Language | TypeScript (strict mode) |
| Styling | Tailwind CSS |
| Component library | shadcn/ui |
| Monorepo | Turborepo |
| State / data fetching | Server Components by default; TanStack Query for client-side mutations |
| Forms | React Hook Form + Zod |
| Testing | Vitest (unit), Playwright (e2e) |
| Deployment | Self-hosted on EKS (matches the learning goal); Vercel is a fallback if EKS costs get uncomfortable |

Next.js is chosen over plain React/Vite because server components meaningfully improve product page performance and SEO, and route handlers give us a clean BFF layer so the browser talks to one API instead of seven. The BFF aggregates calls to the microservices and handles session/auth translation.

Admin dashboard is deferred to Phase 2 but will live as a separate Next.js app in the same Turborepo, sharing a UI package and shared TypeScript types generated from the Protobuf contracts.

## Backend services

Each service uses the language best suited to its workload. No polyglot-for-its-own-sake.

| Service | Language | Framework | Why this language |
|---|---|---|---|
| Catalog | Go | Standard library + grpc-go + chi (REST gateway) | Read-heavy workload, clean gRPC story, low memory footprint, good concurrency model |
| Orders | Java 21 | Spring Boot 3, Spring Security, Spring Data JPA | Transactional core + saga orchestration; Spring's transaction management and mature ecosystem earn their complexity here |
| Inventory | Go | Standard library + grpc-go | Hot path for stock reservations; concurrency and low latency matter |
| Payments (Phase 2) | Java | Spring Boot | Stripe Java SDK is excellent; strong typing helps with money |
| Notifications (Phase 2) | Node.js 22 | Fastify, TypeScript | I/O bound, templating is easy, event-driven |

**MVP note:** Payments logic lives inside the Orders service for the MVP (as an internal component with its own interface). Extracting to a separate service is a Phase 2 task that will itself be a useful learning exercise (service extraction patterns).

## Per-service stack detail

### Catalog — Go

| Concern | Library / Tool | Notes |
|---|---|---|
| gRPC server | `google.golang.org/grpc` + `protoc-gen-go` | Generated from shared `proto/` |
| HTTP gateway | `github.com/go-chi/chi` + `grpc-gateway` | REST↔gRPC transcoding for BFF |
| Database driver | `github.com/jackc/pgx/v5` | No ORM; idiomatic SQL with named queries |
| Migrations | `golang-migrate/migrate` | Embedded; runs on service start |
| Configuration | `github.com/kelseyhightower/envconfig` | Struct-tag env var binding; fails fast on missing required vars |
| Structured logging | `log/slog` (stdlib) | JSON handler; `trace_id` and `span_id` injected via OTel context |
| Tracing | `go.opentelemetry.io/otel` + `otelgrpc` | Auto-instruments gRPC server and client interceptors |
| Metrics | `github.com/prometheus/client_golang` | Custom histograms + counters; `/metrics` endpoint |
| Testing | `github.com/stretchr/testify` + `testcontainers-go` | Integration tests use real Postgres in Docker |
| Linting | `golangci-lint` | `staticcheck`, `errcheck`, `gosec`, `revive` enabled |
| Container | Docker multi-stage, `gcr.io/distroless/static` final image | Minimal attack surface, no shell |

**Design patterns applied:**
- **Repository** — data access isolated behind interfaces; swappable for tests.
- **Cache-aside** — in-memory LRU for hot product lookups, invalidated on product update events.

---

### Inventory — Go

Shares the same Go toolchain and observability setup as Catalog. Key differences:

| Concern | Detail |
|---|---|
| Concurrency control | Optimistic locking via `version` column on stock rows; conflicts retry with backoff |
| HTTP exposure | None — gRPC only; internal service, not called by BFF directly |

**Design patterns applied:**
- **Repository** — stock and reservation access behind interfaces.
- **Optimistic Locking** — prevents oversell under concurrent reservation requests without holding DB locks.

---

### Orders — Java 21 / Spring Boot 3

| Concern | Library / Tool | Notes |
|---|---|---|
| gRPC client | `io.grpc:grpc-java` + `net.devh:grpc-spring-boot-starter` | Calls Catalog (prices) and Inventory (reservations) |
| ORM | Spring Data JPA + Hibernate | Complex transactional model justifies ORM; use native queries for hot paths |
| DB pool | HikariCP (Spring Boot default) | Tune `maximum-pool-size` ≤ RDS `max_connections / replicas` |
| Migrations | Flyway | SQL files in `src/main/resources/db/migration`; runs on startup |
| Money | `java.math.BigDecimal` + custom `Money` value object | Never `float`/`double` for currency |
| Stripe | `com.stripe:stripe-java` | PaymentIntent create + confirm with idempotency key |
| Structured logging | Logback + `logstash-logback-encoder` | JSON to stdout; MDC carries `trace_id`, `order_id` |
| Tracing | OpenTelemetry Java agent (`-javaagent`) | Auto-instruments Spring MVC, JDBC, gRPC |
| Testing | JUnit 5 + Mockito + Testcontainers | Integration tests with real Postgres; Mockito for unit-testing saga steps |
| Build | Gradle 8 (Kotlin DSL) | Faster incremental builds than Maven |
| Code style | Spotless + Google Java Format | Enforced in CI; no review comments about formatting |
| Virtual threads | `spring.threads.virtual.enabled=true` | Java 21 feature; reduces thread-per-request overhead on blocking I/O |

**Design patterns applied:**
- **Saga (Orchestration)** — Orders drives the checkout saga; Inventory and Stripe are participants.
- **Transactional Outbox** — events written to `outbox` table in the same transaction as business state; poller publishes to SNS.
- **State Machine** — `OrderStatus` transitions enforced by an explicit state machine service, not ad-hoc `if` chains.
- **Value Object** — `Money(amount, currency)` is immutable, validated at construction; arithmetic methods enforce currency matching.
- **Idempotent Consumer** — deduplicates incoming SQS events by `event_id` before processing.
- **Repository** — Spring Data repositories for `Order`, `OutboxEvent`, `PaymentEvent`.

---

### BFF / Storefront — Next.js 15

| Concern | Library / Tool | Notes |
|---|---|---|
| Backend calls | `@connectrpc/connect` | Type-safe gRPC-compatible calls from Server Components; no REST needed |
| Client data fetching | TanStack Query v5 | Client-side only; reads default to Server Components |
| Forms | React Hook Form + Zod | Client-side validation; server re-validates — never trust the client |
| Auth | Auth.js (NextAuth v5) | OIDC adapter for Keycloak or Cognito; HTTP-only session cookie |
| Cart persistence | Redis via Server Actions | No client-side cart state; Server Actions own the write path |
| Monorepo | Turborepo | `packages/ui` (shadcn components), `packages/types` (generated Protobuf types) |
| Testing | Vitest (unit), Playwright (e2e) | Playwright tests cover the full checkout golden path |
| Linting | ESLint (Next.js config) + Prettier | |

**Design patterns applied:**
- **BFF (Backend-for-Frontend)** — route handlers aggregate calls to multiple services; browser talks to one API.
- **CQRS-lite** — Server Components own the read path; Server Actions and route handlers own the write path.

---

### Notifications — Node.js 22 (Phase 2)

| Concern | Library / Tool | Notes |
|---|---|---|
| Framework | Fastify 5 | Low overhead; JSON schema validated routes |
| SQS consumer | AWS SDK v3 `@aws-sdk/client-sqs` | Long-polling loop; visibility timeout heartbeat for slow sends |
| Email delivery | AWS SES v2 `@aws-sdk/client-sesv2` | |
| Email templates | React Email | Type-safe, component-based templates; renders to HTML + plain text |
| Testing | Vitest + Testcontainers | |

**Design patterns applied:**
- **Event-Driven Consumer** — reacts to `OrderConfirmed`, `OrderFailed` from SQS; no inbound HTTP for business events.
- **Template Method** — base email layout; each notification type overrides the body section.

## Communication

| Pattern | Technology |
|---|---|
| Sync service-to-service | gRPC (HTTP/2, Protobuf) |
| Client-to-server | REST via Next.js BFF route handlers |
| Async events | AWS SNS (topics) + SQS (queues) with fanout |
| Contracts | Protobuf schemas in a shared `proto/` package, code-generated for Go, Java, TypeScript |
| Idempotency | Client-supplied idempotency keys on all mutating operations |
| Transactional outbox | Every service writes events to an outbox table in the same DB transaction; a poller publishes to SNS |

## Data stores

| Store | Use |
|---|---|
| PostgreSQL (RDS) | One database per service that owns transactional data: Catalog, Orders, Inventory. No shared databases. |
| Redis (ElastiCache) | Cart sessions, rate limiting, short-lived caches |
| S3 | Product images, generated invoices |
| OpenSearch | Deferred to Phase 2 for product search |

One-DB-per-service is strict. Services never read each other's tables. Data sharing happens via gRPC calls or events only.

## Infrastructure

| Concern | Choice |
|---|---|
| Cloud | AWS |
| Container orchestration | EKS (Kubernetes) — pending budget confirmation; ECS Fargate is the fallback |
| Container registry | Amazon ECR |
| Infrastructure as Code | Terraform + Terragrunt |
| Secrets | AWS Secrets Manager, surfaced to Kubernetes via External Secrets Operator |
| Ingress | AWS Load Balancer Controller + NGINX Ingress |
| Certs | cert-manager with Let's Encrypt |
| CDN | CloudFront in front of S3 for product images |

### Terragrunt layer structure (planned)

```
infra/
  terragrunt.hcl                 # root config, remote state, providers
  _envcommon/                    # shared env configs
  foundation/                    # VPC, IAM roles, ECR, Route53, base certs
  platform/                      # EKS cluster, ArgoCD, cert-manager, ingress, observability stack, External Secrets
  services/                      # per-service infra
    catalog/                     # RDS instance, SQS, ECR repo, IAM service account
    orders/
    inventory/
  environments/
    dev/
    staging/                     # optional
```

## CI/CD

| Stage | Tool |
|---|---|
| CI (build, test, lint, security scan) | GitHub Actions |
| Artifact storage | ECR (containers), GitHub Packages (language libs if needed) |
| CD | ArgoCD with GitOps (separate `*-deploy` repos or a single deploy repo) |
| Progressive delivery (Phase 2) | Argo Rollouts for canary deployments |

CI runs on every PR. Merge to main → image pushed to ECR → manifest repo updated → ArgoCD syncs to dev environment. This is the baseline; promotion to staging is manual.

## Observability

| Signal | Tool |
|---|---|
| Instrumentation | OpenTelemetry SDKs in every service |
| Collector | OpenTelemetry Collector (deployed as DaemonSet) |
| Traces | Grafana Tempo |
| Metrics | Prometheus |
| Logs | Grafana Loki |
| Dashboards / exploration | Grafana |
| Alerting | Alertmanager → Slack (email fallback) |

The Grafana OSS stack is chosen over managed alternatives (Datadog, New Relic) because the learning goal is observability patterns, not vendor UI. The mental model transfers to any managed offering.

## Security

| Concern | Approach |
|---|---|
| User auth | OIDC via Keycloak (self-hosted on EKS) or AWS Cognito. Final choice pending; see ADR-005. |
| Service-to-service auth | mTLS via service mesh (Phase 2 if needed); JWT with service identity in MVP |
| Secrets | Secrets Manager + External Secrets Operator; never in Git |
| Network | Private subnets for services, public only for load balancers; security groups are default-deny |
| Database credentials | Short-lived via IAM auth to RDS where possible; rotated static creds otherwise |
| Dependency scanning | GitHub Dependabot + Trivy in CI for container images |

## Developer tooling

| Concern | Tool |
|---|---|
| Local Kubernetes | kind or k3d |
| Local observability | docker-compose with Tempo/Loki/Prometheus/Grafana for fast feedback |
| API mocking | Prism (OpenAPI) or Buf for gRPC |
| Load testing | k6 |
| Chaos testing (Phase 2) | Chaos Mesh |
| Protobuf / gRPC tooling | Buf for linting, breaking change detection, code gen |

## Naming convention

### Repositories

Rule: `gg-{domain}` for all repos.

| Repo | What it is | Phase |
|---|---|---|
| `gg-storefront` | Next.js BFF + storefront (Turborepo root) | 1 |
| `gg-catalog` | Go catalog service | 1 |
| `gg-orders` | Java orders + saga orchestrator | 3 |
| `gg-inventory` | Go inventory service | 3 |
| `gg-proto` | Shared Protobuf definitions (Buf) | 0 |
| `gg-infra` | Terraform / Terragrunt | 0 |
| `gg-notifications` | Node.js notifications service | Phase 2 |
| `gg-payments` | Java payments service (extracted from Orders) | Phase 2 |
| `gg-admin` | Admin dashboard (separate Next.js app) | Phase 5 |

### Turborepo internal packages (inside `gg-storefront`)

Rule: `@gg/{domain}` for all npm packages.

| Package | What it is |
|---|---|
| `@gg/ui` | Shared shadcn/ui component library |
| `@gg/types` | Generated Protobuf TypeScript types |

### Summary rule
- GitHub repos: `gg-{domain}` (kebab-case)
- npm packages inside the monorepo: `@gg/{domain}` (scoped)
- Docker images / ECR repos: `gg-{domain}` (matches repo name)
- Kubernetes namespaces: `gg-{domain}` (matches repo name)

## Version pinning policy

- Use recent stable versions at project start, pin in lockfiles.
- Renovate or Dependabot for dependency updates.
- Breaking upgrades (major versions) get their own PR with tested migration.
