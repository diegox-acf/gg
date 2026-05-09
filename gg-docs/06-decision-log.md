# 06 — Decision Log (ADRs)

Architecture Decision Records. Each ADR captures a decision, the context, the alternatives considered, and the consequences. ADRs are immutable — if a decision changes, write a new ADR that supersedes the old one. Don't edit history.

Format: each ADR is **Context → Decision → Consequences → Alternatives considered**.

---

## ADR-001: Use Next.js with App Router for the frontend

**Status:** Accepted
**Date:** 2026-04-20

**Context:**
The platform needs a performant, SEO-friendly storefront. The tech stack lists "React/Next.js" as open to discussion.

**Decision:**
Use Next.js 15 with the App Router, TypeScript, Tailwind, and shadcn/ui. Deploy self-hosted on EKS (aligns with learning goals).

**Consequences:**
- Server Components give fast product page renders and good SEO.
- Route handlers provide a natural BFF layer, reducing browser-side API complexity.
- Built-in image optimization helps with product photography.
- Self-hosting on EKS adds complexity but serves the learning goal.

**Alternatives considered:**
- **Plain React + Vite:** Rejected. No SSR story for SEO; we'd reinvent the BFF pattern.
- **Remix:** Rejected. Smaller ecosystem; Next has broader industry adoption.
- **Astro:** Rejected. Great for content sites, weaker for app-heavy flows like checkout.
- **Vercel hosting:** Kept as a fallback. If EKS cost becomes uncomfortable we migrate FE to Vercel and save on cluster resources.

---

## ADR-002: Three backend services in the MVP, not eight

**Status:** Accepted
**Date:** 2026-04-20

**Context:**
The user wanted a real-feeling e-commerce system with auth, catalog, cart, orders, payments, notifications, admin, etc. A naïve approach gives each a separate service, producing 8+ services before any are working.

**Decision:**
MVP has three backend services: Catalog, Orders, Inventory. Identity is a managed third party (Keycloak or Cognito). Cart lives in Redis behind the BFF. Payments is a module inside Orders. Notifications and Admin are deferred.

**Consequences:**
- Service count stays manageable for a 4–6 week MVP built by one person.
- The three chosen services are exactly those that exercise the top learning priority (microservices communication, saga).
- Extracting Payments and Notifications later becomes its own valuable learning exercise (service decomposition).
- Some realism is sacrificed: a "real" platform would have distinct Payments and Auth services.

**Alternatives considered:**
- **8+ services from day one:** Rejected. Schedule death.
- **Monolith first, extract later:** Rejected. Defeats the core learning goal of distributed systems communication.
- **Two services (Catalog + Orders-with-Inventory):** Rejected. Merging inventory into Orders removes the gRPC + saga coordination we explicitly want to practice.

---

## ADR-003: Polyglot backend — Go for high-throughput services, Java for the saga orchestrator

**Status:** Accepted
**Date:** 2026-04-20

**Context:**
The user listed Java/Spring, Node.js/TS, and Go as desired technologies. A naïve split is "one service per language for exposure", but that creates cognitive overhead.

**Decision:**
- Catalog and Inventory in Go.
- Orders in Java/Spring.
- Node/TS is reserved for Phase 2 Notifications service.

**Consequences:**
- Go services exercise lightweight services with good concurrency; Java service exercises mature transactional frameworks and the Stripe SDK.
- Three languages in production-like infra is enough variety; four would cause context-switching pain.
- Each language choice has a defensible reason tied to the workload, not "because the CV said so".

**Alternatives considered:**
- **All Java:** Rejected. Misses the Go learning.
- **All Go:** Rejected. Misses Spring's transactional strengths for the saga core.
- **Three languages from day one with Node as a Cart service:** Rejected. Cart is well-served by the BFF + Redis; a separate Node service adds boilerplate without learning value.

---

## ADR-004: SNS/SQS over Kafka for the event backbone

**Status:** Accepted (pending user confirmation — see "Pending decisions" below)
**Date:** 2026-04-20

**Context:**
Event-driven patterns (outbox, saga, compensations) can be learned equally well on SNS/SQS or Kafka. Kafka has higher ops cost.

**Decision:**
Use AWS SNS (topics) + SQS (queues with fanout) for the event backbone in the MVP.

**Consequences:**
- Zero operational overhead; fully managed.
- Fits naturally with AWS IAM and Terraform.
- Missed learning: Kafka-specific concepts (partitions, consumer groups, log compaction, exactly-once semantics via transactional producers). Can be added in Phase 5 as a standalone exploration.
- Event ordering per-key is not as strong as Kafka's partition ordering — we'll address ordering needs via idempotency and versioned events.

**Alternatives considered:**
- **MSK (managed Kafka):** Rejected for MVP. Meaningful cost, steeper learning curve at the infra level. Worth exploring in Phase 5.
- **Self-hosted Kafka:** Rejected. Ops burden.
- **EventBridge:** Considered. Great for AWS-native event routing but less flexible for our patterns.
- **RabbitMQ on EKS:** Rejected. Extra operational surface for no learning gain.

---

## ADR-005: Managed identity (Keycloak or Cognito), not custom auth — final choice deferred to Phase 2 start

**Status:** Proposed (decision deferred to start of Phase 2)
**Date:** 2026-04-20

**Context:**
Security is learning priority #6. Building custom auth is a well-known time sink with high footgun risk.

**Decision:**
Use a managed identity provider. Choose between **Keycloak self-hosted on EKS** and **AWS Cognito** at the start of Phase 2, after Phase 0 and Phase 1 are complete.

**Consequences:**
- Either option gives OIDC and JWT issuance.
- Keycloak: more control, more ops, better learning, runs in-cluster.
- Cognito: less control, no ops, tighter AWS integration, less learning.

**Alternatives considered:**
- **Roll our own with Spring Security:** Rejected. Violates "security is priority 6"; too much time investment.
- **Auth0 or Clerk:** Rejected. Paid services; distracts from "real infra" goal. Fine in theory.

**Open decision factors:**
- If AWS budget is tight → Cognito (zero extra infra).
- If the week has slack and the learning interest is high → Keycloak.

---

## ADR-006: Transactional outbox pattern for all event publishing

**Status:** Accepted
**Date:** 2026-04-20

**Context:**
Services need to publish events when state changes. Dual-writing to the DB and to SNS risks partial failures (DB commits, SNS publish fails, or vice versa).

**Decision:**
Every service that emits events writes them to an `outbox` table inside the same DB transaction as the business state change. A separate outbox publisher reads unpublished rows and pushes to SNS.

**Consequences:**
- Atomic by construction: if the DB commit succeeds, the event will eventually be published.
- At-least-once delivery — consumers must be idempotent.
- Small latency cost (poller interval, default 500ms).
- Requires an `outbox` table and a scheduled task in every event-emitting service.

**Alternatives considered:**
- **Publish first, then write DB:** Rejected. Can publish events for changes that never committed.
- **Best-effort dual write:** Rejected. Silent data corruption under failure.
- **CDC (Debezium) from the DB WAL:** Considered. More robust than polling, significantly more ops. Reserved for Phase 5.

---

## ADR-007: Grafana OSS stack for observability, not a managed vendor

**Status:** Accepted
**Date:** 2026-04-20

**Context:**
Observability is learning priority #2. Managed vendors (Datadog, New Relic) are easier to set up but hide the patterns.

**Decision:**
Deploy the Grafana OSS stack (Tempo + Prometheus + Loki + Grafana) in-cluster. Use OpenTelemetry SDKs in all services.

**Consequences:**
- Full control over the observability pipeline; every pattern is visible.
- OTel is vendor-neutral — patterns transfer to any managed offering later.
- Meaningful cost: roughly one node group worth of capacity for the stack.
- Phase 2 could swap in Grafana Cloud free tier if storage cost becomes a problem.

**Alternatives considered:**
- **Datadog / New Relic:** Rejected. Hides the patterns; monthly cost.
- **AWS native (CloudWatch, X-Ray):** Rejected. Fragmented UX; trace/log/metric correlation is worse; CloudWatch is expensive at volume.
- **Elastic stack:** Rejected. Older paradigm; OTel fits Grafana better.

---

## ADR-008: Monorepo for frontends, polyrepo for backend services

**Status:** Proposed
**Date:** 2026-04-20

**Context:**
Monorepo vs polyrepo is contentious. Each has tradeoffs.

**Decision:**
- **Frontends:** Turborepo monorepo containing the storefront, the eventual admin dashboard, and shared packages (UI, types, utilities).
- **Backend services:** One repo per service (`catalog-service`, `orders-service`, `inventory-service`). Shared Protobuf definitions live in a single `proto` repo, consumed as a versioned dependency.

**Consequences:**
- Frontends share components and types cleanly without inter-repo gymnastics.
- Backend services enforce real boundaries — no accidental cross-imports.
- Slightly more CI/CD setup (each backend repo has its own pipeline).
- Realistic: mirrors how many companies structure their code.

**Alternatives considered:**
- **Full monorepo:** Considered. Tempting for shared tooling, but erodes boundary discipline and complicates deploy independence.
- **Full polyrepo including frontends:** Rejected. Frontend shared packages become a pain.

---

---

## ADR-009: AWS budget and environment stance

**Status:** Accepted
**Date:** 2026-05-01

**Context:**
Phase 0 required a concrete budget decision before provisioning infrastructure. The pending decision PD-01 was blocking IaC scaffolding.

**Decision:**
$150–300/mo budget, 24/7 always-on environment. Single `dev` environment for all phases. Graviton spot instances and a single NAT Gateway are the primary cost controls.

**Consequences:**
- No cost optimization pressure; EKS remains live between sessions.
- Estimated Phase 0 cost: ~$135–145/mo (EKS control plane $73 + 3× t4g.medium spot ~$30 + NAT GW ~$32 + ECR/misc ~$5).
- Single NAT Gateway is an accepted SPoF; fine for a learning environment.
- This budget comfortably supports the Grafana OSS stack in-cluster (ADR-007).

**Alternatives considered:**
- **Nightly teardown:** Rejected. Context-switching overhead outweighs the savings.
- **LocalStack + kind:** Rejected. Defeats learning goal #3 (K8s, IaC in real AWS).

---

## ADR-010: EKS from day one

**Status:** Accepted
**Date:** 2026-05-01

**Context:**
PD-02 was pending: ECS Fargate first, then migrate, vs. EKS from day one. ADR-009 resolved the budget concern that made ECS tempting.

**Decision:**
EKS from day one. Kubernetes 1.30, managed node groups, Graviton spot (t4g.medium). No ECS staging phase.

**Consequences:**
- More upfront complexity in Phase 0 (cluster, node IAM, OIDC, addons).
- Directly serves learning goal #3 (K8s); ArgoCD GitOps from day one.
- IRSA pattern is established early and reused for every service.
- Eliminates a future migration that would produce no learning value.

**Alternatives considered:**
- **ECS Fargate → EKS migration:** Rejected. Migration overhead + re-learning. The migration itself is not interesting; operating EKS is.
- **kind/k3d locally:** Rejected. Does not exercise AWS-native patterns (LBC, ESO, IRSA, cert-manager).

---

## ADR-011: Phase 0 hello-world service design

**Status:** Accepted
**Date:** 2026-05-01

**Context:**
Phase 0 exit criteria require a service deployed end-to-end. The design must validate the full pipeline without introducing domain complexity that distracts from infra learning.

**Decision:**
`gg-hello-world` — minimal Go 1.22 HTTP service.
- Endpoints: `GET /health` (200 JSON), `GET /metrics` (Prometheus text format)
- OTel SDK wired — traces exported to OTel Collector via gRPC OTLP (`localhost:4317`)
- Structured JSON logs via `log/slog`
- Multi-stage Dockerfile targeting `linux/arm64` (distroless final image)
- Single binary, no database, no gRPC

**Consequences:**
- Validates full pipeline: ECR → EKS → ArgoCD → Grafana without domain complexity.
- OTel wiring here becomes the canonical pattern for all subsequent services (Catalog, Orders, Inventory).
- Small footprint; fast CI builds.

**Alternatives considered:**
- **A richer demo service with a database:** Rejected. Adds RDS provisioning as a Phase 0 dependency; obscures whether infra issues are service bugs.

---

## ADR-012: Catalog service Go project layout and library choices

**Status:** Accepted
**Date:** 2026-05-03

**Context:**
Phase 1 requires scaffolding `gg-catalog` in Go. Library choices must be locked before writing the scaffold to avoid mid-build changes.

**Decision:**
Go 1.22, module `github.com/diegox-acf/gg-catalog`. Layout follows `cmd/` + `internal/` (domain, grpc, rest, postgres, config, observability). No framework; stdlib HTTP via chi.

| Library | Version | Why |
|---|---|---|
| `google.golang.org/grpc` | v1.68 | Standard gRPC runtime |
| `google.golang.org/protobuf` | v1.35 | Protobuf runtime |
| `github.com/go-chi/chi/v5` | v5.1 | Lightweight stdlib-idiomatic router |
| `github.com/jackc/pgx/v5` | v5.7 | Idiomatic Postgres driver, no ORM |
| `github.com/golang-migrate/migrate/v4` | v4.18 | DB migrations, embedded in binary |
| `go.opentelemetry.io/otel` | v1.32 | OTel traces + metrics |
| `go.opentelemetry.io/otel/exporters/otlp/otlptrace/otlptracegrpc` | v1.32 | OTLP gRPC trace exporter |
| `go.opentelemetry.io/contrib/instrumentation/google.golang.org/grpc/otelgrpc` | v0.57 | Auto-instrument gRPC |
| `go.opentelemetry.io/contrib/instrumentation/net/http/otelhttp` | v0.57 | Auto-instrument chi HTTP |
| `github.com/prometheus/client_golang` | v1.20 | `/metrics` endpoint |
| `github.com/caarlos0/env/v11` | v11.2 | Struct-tag env config |
| `log/slog` | stdlib | Structured JSON logs |

**Not used:** GORM/sqlx (raw pgx only), Viper/godotenv (caarlos0/env covers all needs), Zap/Zerolog (slog is sufficient, zero deps).

**Consequences:**
- Raw pgx enforces idiomatic SQL; no ORM magic hides query behavior.
- chi is a near-zero-cost wrapper over `net/http`; easy to drop if stdlib suffices later.
- slog is stdlib from Go 1.21; zero dependency footprint.
- caarlos0/env keeps config explicit and testable.

**Alternatives considered:**
- **GORM:** Rejected. Hides SQL; violates docs spec "idiomatic SQL, no ORM".
- **Viper:** Rejected. Over-engineered for env-only config; hierarchical config files are not needed.
- **Zap:** Rejected. slog covers the use case; adding a dependency requires justification.

---

## ADR-013: docker-compose replaces EKS (supersedes ADR-009, ADR-010)

**Status:** Accepted
**Date:** 2026-05-08

**Context:**
ADR-009 committed to a $150–300/mo AWS budget and ADR-010 committed to EKS from day one. After scaffolding `gg-infra` (Terraform/Terragrunt), the decision was revisited: the operational overhead of IAM, VPC, EKS node groups, IRSA, and Terraform state management was consuming time that should go toward the core distributed-systems learning goals (microservices communication, observability, saga pattern).

**Decision:**
Run all services via docker-compose. No Kubernetes, no EKS, no Terraform/Terragrunt. The `gg-infra` repo is archived (left in place, not referenced going forward). `gg-local/docker-compose.yml` is the single source of infrastructure truth.

**Consequences:**
- Zero cloud costs.
- No HPA, rolling deploys, or Kubernetes RBAC — these are non-goals for this phase.
- CI builds and tests but does not deploy; the stack runs locally.
- `docker compose down -v && docker compose up -d` replaces `terragrunt run-all destroy/apply`.
- Learning goal #3 shifts from "IaC & Kubernetes" to "container orchestration and service networking."

**Alternatives considered:**
- **Keep EKS, reduce cost:** Rejected. Nightly teardown adds context-switching overhead; the infra complexity still dominates dev time.
- **kind/k3d locally:** Rejected. Adds Kubernetes complexity without the cloud benefits; docker-compose is simpler and sufficient for the learning goals.

---

## ADR-014: Kafka replaces SNS/SQS (supersedes ADR-004)

**Status:** Accepted
**Date:** 2026-05-08

**Context:**
ADR-004 chose SNS/SQS as the event backbone. ADR-013 dropped AWS entirely, making SNS/SQS unavailable. A local-first replacement was needed.

**Decision:**
Apache Kafka 3.7 (bitnami/kafka, KRaft mode — no ZooKeeper) is the event backbone. Single broker for local dev. Topics created at startup with `auto.create.topics.enable=true`.

**Topics:**
- `catalog.product-updated`
- `orders.order-created`, `orders.order-cancelled`
- `inventory.stock-reserved`, `inventory.stock-released`

Dead-letter handling: a `*.dlq` topic per consumer group, populated after 3 failed retries in the consumer.

**Consequences:**
- Kafka teaches partitioning, consumer groups, and offset management — concepts SNS/SQS abstracts away. Higher learning value.
- KRaft eliminates ZooKeeper; single-container Kafka setup is clean.
- Dead-letter handling requires explicit retry logic in consumers (no native redrive policy); this is a useful learning exercise.
- Context propagation for distributed tracing uses Kafka message headers (W3C TraceContext).
- Spring Kafka (`spring-kafka`) for Orders; `kafka-go` or `sarama` for Go services.

**Alternatives considered:**
- **RabbitMQ:** Rejected (user explicitly chose Kafka).
- **Redis Streams:** Rejected. Less expressive; Kafka is the industry standard for this pattern.
- **LocalStack SNS/SQS:** Rejected. User explicitly said "remove all AWS stuff."

---

## ADR-015: Full monorepo with per-service branch versioning (supersedes ADR-008)

**Status:** Accepted
**Date:** 2026-05-09

**Context:**
ADR-008 proposed frontends in a Turborepo monorepo and backends in separate repos, with protos in a standalone `gg-proto` repo consumed as a versioned dependency. The motivation for revisiting: GitHub Actions-based proto code generation requires all services to share a single repository — otherwise cross-repo automation requires deploy keys per target repo, coordinated PR merges across repos, and version pinning ceremony.

**Decision:**
All `gg-*` workloads live in a single monorepo at the repo root. Proto source files and generated stubs both live in `gg-proto/`. Generated stubs (`gen/go`, `gen/java`, `gen/ts`) are committed back by CI after each proto change — not regenerated at build time.

**Branch naming:** `gg-{service}/{version}` (e.g. `gg-catalog/1.0.0`). Versions are set manually by the developer. On merge to `main`, a git tag `gg-{service}/v{version}` is created automatically by the release workflow.

**CI trigger strategy:**
- Each service has its own workflow, triggered by pushes to `gg-{service}/**` branches.
- `gg-proto` workflow triggers on any push touching `gg-proto/proto/**`; it runs `buf generate` and commits stubs back to the same branch with `[skip ci]`.
- On PR merge to `main`: the release workflow extracts service and version from the branch name and creates the git tag.

**Root orchestration:** `Makefile` with per-service targets (`make proto-gen`, `make catalog-build`, etc.). No Nx or Bazel — Go, Gradle, and pnpm/Turborepo handle their own builds natively.

**Proto consumption per language:**
- Go services: `go.work` workspace at root links `gg-proto/gen/go` as a local module.
- Java (Orders): `gg-proto/gen/java` added as a source directory in Gradle.
- TypeScript: `gg-proto/gen/ts` referenced from `gg-storefront/packages/types`.

**Consequences:**
- Proto generation is a single workflow, one `buf generate`, stubs visible and reviewable in PRs.
- Branch names encode service identity and version — CI routes without extra configuration.
- Turborepo remains scoped to `gg-storefront/` for the JS/TS workspace.
- Generated code in git is an accepted tradeoff for simplicity.

**Alternatives considered:**
- **Separate `gg-proto` repo with cross-repo push:** Rejected. Deploy keys per repo, coordinated merges, version pinning — too much overhead for a solo project.
- **Buf Schema Registry (BSR):** Rejected. Requires BSR account + token; network dependency; overkill.
- **Build-time generation (no committed stubs):** Rejected. Each service's build needs Buf + protoc; inconsistent across Go/Gradle/pnpm.
- **Nx or Bazel:** Rejected. Value shows at team scale; native build tools + Make are sufficient.

---

## Resolved pending decisions

The pending decisions recorded below are now closed. No further action required.

| ID | Decision | Resolution |
|---|---|---|
| PD-01 | AWS budget | Superseded by ADR-013 (dropped AWS) |
| PD-02 | Kubernetes strategy | Superseded by ADR-013 (docker-compose) |
| PD-03 | Event backbone | Superseded by ADR-014 (Kafka) |
| PD-04 | Team size | Solo — branching strategy is `main` + feature branches, no formal review process |
| PD-05 | Guest checkout | No guest checkout in MVP — auth is required before cart persistence (Phase 2) |
| PD-06 | Order number format | Human-friendly: `GMR-YYYY-NNNNN` (e.g. `GMR-2026-00042`), generated in Orders service |
