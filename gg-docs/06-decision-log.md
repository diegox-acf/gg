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

## ADR-016: Remove gRPC; use REST for service-to-service communication (supersedes ADR-012 library choices, ADR-015 proto strategy)

**Status:** Accepted
**Date:** 2026-06-02

**Context:**
The project was scaffolded with gRPC as the sync communication layer (protobuf contracts, buf toolchain, generated stubs in Go and TypeScript, OTel gRPC interceptor). At Phase 1, no service actually consumes the gRPC server: the storefront uses mock data, gg-inventory has no implementation, and gg-orders doesn't exist. The full proto toolchain (buf, protoc-gen-go, protoc-gen-go-grpc, ConnectRPC TypeScript stubs) added build complexity and a non-trivial learning surface (IDL management, breaking change detection, multi-language codegen) without delivering observable benefit at the current scale.

**Decision:**
Remove gRPC entirely. All sync service-to-service calls use REST (HTTP/JSON). The proto toolchain (buf, generated stubs, gg-proto/ directory) is deleted. The OTel trace exporter is switched from OTLP gRPC to OTLP HTTP (port 4318) to eliminate the direct grpc-go dependency from application code.

**Consequences:**
- Eliminates the proto toolchain from the dev and CI loop: no buf, no codegen, no generated files to keep in sync.
- REST is already implemented in gg-catalog (chi router, JSON handlers); no new server-side work needed.
- Service contracts are expressed as OpenAPI docs or inline in gg-docs — lower ceremony than IDL.
- gRPC remains available as a Phase 3+ investigation if the learning goal resurfaces (e.g., benchmarking REST vs gRPC latency for the catalog read path).
- OTLP HTTP exporter (port 4318) is functionally equivalent; OTel Collector already exposes both ports.
- Learning priority 1 narrows from "gRPC, events, saga" to "events, saga" for the current phase.

**Alternatives considered:**
- **Keep gRPC but defer codegen to build time:** Rejected. Still requires buf + protoc in every build environment; no simplification.
- **Keep gRPC for Orders→Inventory only:** Rejected. Inventory is not yet implemented; this is a premature optimization.
- **ConnectRPC (gRPC-over-HTTP):** Rejected. Same codegen overhead; REST is simpler and sufficient.

---

## ADR-017: Keycloak as the identity provider (finalizes ADR-005)

**Status:** Accepted
**Date:** 2026-06-07

**Context:**
ADR-005 chose a *managed* identity provider but deferred the final pick between
**Keycloak self-hosted** and **AWS Cognito** to the start of Phase 2, with the deciding
factor being AWS budget vs. learning interest. Since then, ADR-013 removed AWS/EKS
entirely — the platform is now docker-compose, local/dev forever. Cognito is an AWS-only
managed service and would reintroduce a hard AWS dependency, directly contradicting
ADR-013. The roadmap and tech-stack already assume Keycloak.

**Decision:**
Use **Keycloak** (self-hosted via docker-compose) as the OIDC provider for all of GG
Gaming. It runs as the `keycloak` service in `gg-local/` (image `quay.io/keycloak/keycloak:26.1`,
`start-dev --import-realm`, host port **8081**), backed by a private `postgres-keycloak`
database so registered users persist across restarts. The `gg` realm is defined as code in
`gg-local/keycloak/realm-export.json` and imported on first boot.

Realm shape:
- Realm `gg`; realm roles `customer` (default shopper) and `admin`.
- One confidential client `gg-storefront` for the Next.js BFF, with **Direct Access Grants**
  enabled (password grant — powers the custom branded login per the Phase 2 decision) and a
  **service account** granted `realm-management` roles `manage-users`/`view-users`/`query-users`
  (powers self-registration via the Admin REST API).
- A seed `demo` / `demo12345` user for local testing.

**Consequences:**
- No AWS dependency; consistent with ADR-013. Full control over realms, clients, and token
  claims — better for the security learning goal (priority #6).
- We own Keycloak's ops (upgrades, DB) — acceptable at local/dev scale; the image is pinned
  to avoid the `latest`-tag config drift already seen with Tempo.
- Issuer is `http://localhost:8081/realms/gg` for host-run services; if services later move
  into the compose network, `KC_HOSTNAME`/issuer config must be revisited.
- Tokens are validated at the BFF; downstream services trust `x-user-id`/`x-user-roles`
  headers (see architecture), with the Catalog additionally doing optional JWKS validation.

**Alternatives considered:**
- **AWS Cognito:** Rejected. Contradicts ADR-013 (no AWS); zero-ops benefit is moot when the
  whole platform is local docker-compose, and it offers less learning value and less control.
- **Keycloak hosted login pages (redirect/Authorization Code flow):** Rejected for the storefront
  UX. We use custom branded login/registration forms in the storefront (Auth.js Credentials
  provider + password grant) so the auth experience matches the GG design system. The hosted
  Account console remains available for admin use.

---

## ADR-018: Orchestrated saga with synchronous stock reservation

**Status:** Accepted
**Date:** 2026-06-09

**Context:**
Phase 3 implements checkout as a distributed saga across Orders, Inventory, and Stripe.
The docs disagreed on *how stock is reserved*. The UC-05 sequence diagram
(`02-business-logic.md`) and the "saga orchestrator" framing (`03-architecture.md`) show
Orders calling Inventory **synchronously** to reserve stock and deciding the next step on
the response. But the Kafka topic tables (`03-architecture.md`, `09-data-model.md`) list
`inventory.stock-reserved` / `inventory.stock-released` topics, which read as an
**event-driven (choreographed)** reservation. A reservation is a request that needs an
immediate yes/no answer before taking the customer's money — making it fire-and-forget over
Kafka forces the order to block on an async round-trip and complicates compensation. This
ambiguity needed to be resolved before building Orders (Milestone B) and the event backbone
(Milestone C). ADR-016 already removed gRPC in favour of REST for service-to-service calls.

**Decision:**
Use an **orchestration** saga (not choreography), with the **Orders service as the
orchestrator**, and reserve stock via a **synchronous REST** call:

- **Reserve = synchronous REST.** Orders calls Inventory `POST /v1/reservations` and branches
  on the HTTP response (201 reserved → proceed to payment; 409 insufficient stock → fail the
  order, no payment attempted). No Kafka in the reserve step.
- **Terminal outcomes = Kafka events.** Only the *committed* outcome is asynchronous: on
  payment success Orders emits `OrderConfirmed`; on failure/decline/timeout it emits
  `OrderFailed`. Inventory consumes these and **commits** (drops the reservation, stock stays
  decremented) or **releases** (returns stock to available) the existing reservation.
- **Inventory `Stock*` events are notifications, not control flow.** `inventory.stock-reserved`
  / `stock-released` remain as outbox/Kafka domain events for observability and any future
  consumers, but no saga step waits on them.
- The orchestrator drives an explicit state machine
  `PENDING → RESERVING → PAYING → CONFIRMED | FAILED`, with compensation on each branch
  (reserved-but-not-paid → release; never charge without a reservation).

**Consequences:**
- Reservation gives an immediate, strongly-consistent answer — the customer is told about an
  out-of-stock item before any payment is attempted (roadmap criterion 3).
- The orchestrator centralizes the saga logic and compensations in one service (Orders),
  which is easier to reason about and recover than distributed choreography — at the cost of
  Orders being a coordination hub (acceptable; it already owns the order lifecycle).
- Two transports by design: **REST for the request/response reserve**, **Kafka for terminal
  commit/release**. Trace context must propagate over *both* HTTP headers and Kafka headers
  for a single connected trace.
- The `inventory.stock-*` topics stay in the schema but are not on the critical path; this is
  intentional, not dead code.

**Alternatives considered:**
- **Choreographed/event-driven reservation** (Orders publishes `OrderPlaced`, Inventory
  reserves and publishes `StockReserved`/`StockRejected`, Orders reacts): Rejected. Adds an
  async round-trip to a step that needs a synchronous yes/no, blocks checkout on Kafka
  latency, and scatters the saga decision logic across services. Contradicts the UC-05
  sequence diagram.
- **Two-phase commit / distributed transaction across Orders+Inventory+Stripe:** Rejected.
  No XA across HTTP/Stripe; the saga pattern with compensations is the established approach
  and the explicit learning goal.
- **Reserve synchronously *and* commit/release synchronously** (no Kafka at all): Rejected.
  The terminal commit/release must survive Orders crashing mid-flight; routing them through
  the transactional outbox + Kafka gives at-least-once delivery and recovery, which a direct
  synchronous call after payment would not.

---

## ADR-019: Delivery semantics — outbox + idempotent consumers ("effectively-once"), not Kafka EOS

**Status:** Accepted
**Date:** 2026-06-14

**Context:**
Before building the event backbone (Milestone C — outbox pollers + Kafka consumers), we
needed an explicit position on **delivery guarantees and data-loss windows**. The question
that prompted this: with the outbox, idempotency keys, reservations, Stripe, and Kafka all
in play, "will any data be lost — and shouldn't we be using Kafka's Exactly-Once Semantics
(EOS)?"

Kafka EOS = **idempotent producer + transactions (`transactional.id`) + `read_committed`
consumers**. It delivers exactly-once for one specific shape: a **consume → process →
produce loop entirely inside Kafka** (the Kafka Streams case), making "publish output
records + commit input offsets" atomic. Crucially, Kafka EOS **cannot** make a **Postgres
commit + a Kafka publish** atomic — there is no XA transaction spanning the database and the
broker. In this platform every event originates from a relational state change (an order is
born in Postgres, not in a Kafka consume loop — see ADR-006, ADR-018), so the dangerous
boundary is Postgres↔Kafka, which native EOS does not cover. ADR-004's consequences had
flagged "exactly-once semantics via transactional producers" as deferred learning; this ADR
resolves the stance now that it matters.

**Saga vs EOS — not the same layer (a clarification, since the two are easily conflated).**
The saga pattern (ADR-018) and Kafka EOS are orthogonal and solve different problems:
- **Saga** is an *application/orchestration*-layer pattern for keeping a multi-service
  *business process* consistent without a distributed ACID transaction — via a local
  transaction per step plus **compensating actions**. It predates Kafka, is
  transport-agnostic (ours even reserves stock over plain REST, ADR-018), and depends on
  EOS *not at all*.
- **Kafka EOS** is a *transport*-layer feature (idempotent producer + transactions +
  `read_committed`) for duplicate-free delivery inside a Kafka pipeline.

What the saga actually *requires* is **reliable delivery + idempotency** — and it is
explicitly designed to *tolerate at-least-once* delivery (that is precisely why its steps
must be idempotent and compensations exist). The desirable property people shorthand as
"exactly-once *processing*" is therefore an **effect** we obtain with idempotency (outbox +
`event_id` dedup), not Kafka's transactional EOS **feature**. So "we are not using EOS"
removes nothing the saga needs.

**Decision:**
Achieve end-to-end **effectively-once** = **at-least-once delivery + idempotent consumers**,
built on the transactional outbox (ADR-006). Do **not** use Kafka transactions /
`transactional.id` for the Postgres-sourced event flow. The system deliberately favours
*possible duplicates* (neutralised by idempotency) over *any loss*. Concretely:

- **Atomicity at the source (Postgres):** state row + `outbox` row commit in one DB
  transaction (ADR-006). The poller relays unpublished rows to Kafka and marks
  `published_at` only after a successful ack → at-least-once (a crash between publish and
  mark re-publishes → a duplicate, never a loss).
- **Producer (the outbox poller):** `acks=all` + `enable.idempotence=true` (default since
  client 3.0; dedups *producer retries* per partition via producer-id + sequence numbers),
  `max.in.flight.requests.per.connection ≤ 5` to preserve ordering under idempotence. This
  is the *idempotent-producer* half of EOS — adopted; the *transactions* half is not.
- **Consumer:** `enable.auto.commit=false`, commit the offset **only after** processing
  succeeds (at-least-once); **dedup by `event_id`** (the consumer-side idempotency that makes
  the effect exactly-once); DLQ after 3 retries (ADR-014). `isolation.level=read_committed`
  set for correctness even though we publish no Kafka transactions.
- **Broker/topic durability target (production values):** `replication.factor ≥ 3`,
  `min.insync.replicas = 2`, `unclean.leader.election.enable = false`, and the same for the
  internal `__consumer_offsets` / transaction-state topics. The non-loss guarantee for an
  acked message requires the trio **`acks=all` + `min.insync.replicas=2` +
  `unclean.leader.election=false`** together; any one missing reopens a loss window.

**Local-dev stance (ADR-013):** the single-broker `gg-local` Kafka keeps
`replication.factor = 1` / `min.insync.replicas = 1` (true RF=3 needs 3 brokers, a non-goal
locally). The **application-side** config (producer `acks=all` + idempotence, manual
consumer commit + `event_id` dedup) is made production-correct now, because that is where
the logic lives and transfers. The broker durability values above are documented as the
production checklist, not enforced in the local compose.

**Consequences:**
- No logical data loss by design: under normal operation and clean crashes/restarts, orders,
  inventory, and payment state lose ~0%. Remaining loss windows are **infrastructure-failure
  specific** and confined to the deliberately single-node local stack: RF=1 Kafka (volume
  loss drops events already marked published), Redis cart with no persistence (~100% loss on
  Redis restart — acceptable; carts are ephemeral, TTL 7d/90d), and Postgres with no
  replication/backups (`down -v` or volume corruption = total loss).
- Consumers **must** be idempotent (dedup by `event_id`); this is now a hard requirement on
  every consumer, not a nicety.
- Trace context must propagate over **both** HTTP headers and Kafka message headers (W3C
  TraceContext) for a single connected trace — and the outbox `trace_id` must be captured
  from the OTel API, not MDC (see the Milestone-B fix).
- We forgo Kafka's native exactly-once machinery and its overhead (transaction coordinator,
  `read_committed` latency) — correct, since it would be redundant for a DB-sourced flow.
- Production-readiness is a config change (broker RF/min-isr + more brokers), not a redesign.

**Alternatives considered:**
- **Kafka EOS (transactions + `transactional.id` + `read_committed`):** Rejected for the
  Postgres-sourced flow. It cannot span the DB↔Kafka boundary that actually matters here, and
  layering it on top of the outbox adds a transaction coordinator and latency for no
  additional guarantee. The idempotent-*producer* subset is adopted; full transactions are
  not. (EOS remains the right tool for a future pure Kafka-to-Kafka consume-process-produce
  stage, e.g. Kafka Streams — revisit then.)
- **At-most-once (commit offset before processing):** Rejected. Trades duplicates for actual
  loss — the opposite of the desired bias.
- **CDC (Debezium) instead of the polling outbox:** Considered, deferred (already noted in
  ADR-006). More robust relay, significantly more ops; revisit in Phase 5.
- **XA / two-phase commit across Postgres and Kafka:** Rejected. No practical XA across these
  systems; the outbox is the standard answer (consistent with ADR-018's rejection of 2PC).

---

## ADR-020: Stripe payment is asynchronous — webhook drives the terminal transition

**Status:** Accepted
**Date:** 2026-06-17

**Context:**
Milestone D1 stubbed payment (the saga auto-confirmed at PAYING). D2 wires real
Stripe (test mode). The question D2 forces: **what makes an order CONFIRMED?** Two
shapes were possible.

1. **Synchronous confirm:** in the PAYING step, create + confirm a PaymentIntent and
   read the API response — `succeeded` → CONFIRMED, decline → FAILED — all inside the
   `POST /orders` request. The webhook becomes a redundant audit signal.
2. **Asynchronous confirm:** the PAYING step creates + confirms the PaymentIntent and
   **stops**; the order rests in PAYING. Stripe's **webhook** (`payment_intent.succeeded`
   / `payment_intent.payment_failed`) is the authority that makes the terminal
   transition.

The synchronous response is not a reliable source of truth for payment outcome:
many payment methods complete asynchronously (3DS/SCA, delayed bank methods, async
captures), and even for cards the authoritative, replayable record of "what finally
happened" is the webhook. Stripe's own guidance is to **fulfill on the webhook**, not
on the create/confirm response. This is also the natural fit for the saga: the PAYING
step is a long-running external interaction whose result arrives out-of-band.

**Decision:**
Payment is **asynchronous; the webhook is the single authority** for the terminal
transition.

- **PAYING step (`SagaOrchestrator.initiatePayment`):** create + confirm a PaymentIntent
  (`amount = total_cents`, `metadata.order_id`), persist `payment_intent_id`, and return.
  The order stays in PAYING. The Stripe idempotency key `order-<id>-pi` makes the create
  safe to retry without double-charging.
- **`POST /orders`** therefore returns the order in **PAYING** on the happy path (still
  201 — the resource exists); the client polls `GET /orders/{id}` for the terminal state.
  A *reservation* failure still fails synchronously (no PaymentIntent was created).
- **Webhook (`POST /webhooks/stripe`):** verify the signature against the signing secret
  (raw body required), then `payment_intent.succeeded` → `confirmPayment` (CONFIRMED +
  `OrderConfirmed` outbox) and `payment_intent.payment_failed` → `failPayment` (FAILED +
  `OrderFailed` outbox, on which Inventory releases the reservation). Other event types
  are acknowledged (200) and ignored. Bad signature → 400.
- **Idempotency (two independent guards, consistent with ADR-019's at-least-once stance —
  Stripe also delivers webhooks at-least-once):** the `payment_events.stripe_event_id`
  UNIQUE constraint records each event at most once, and the saga transitions are no-ops
  once terminal. Ordering is **process-then-record** so a crash between the two re-runs the
  (idempotent) saga rather than silently swallowing the event.
- **A declined card is not a gateway error:** the PaymentIntent exists and Stripe emits
  `payment_intent.payment_failed`, so the decline flows through the webhook like any other
  outcome. A `PaymentGatewayException` (no PaymentIntent created at all — auth/network)
  fails the order synchronously, since no webhook will follow.

**Dev ergonomics:** there is no card-entry UI yet, so the gateway confirms server-side
with a configurable test PaymentMethod (`stripe.test-payment-method`, default
`pm_card_visa`; `pm_card_chargeDeclined` for the failure path). The real webhook still
fires and drives the transition, so the asynchronous path is exercised end-to-end via
`stripe listen --forward-to localhost:8083/webhooks/stripe`. When the storefront gains a
real Stripe Elements checkout, only the confirm source changes — the webhook contract is
unchanged.

**Consequences:**
- The saga is now genuinely **paused** between PAYING and terminal, waiting on an external
  event. An order can be stuck in PAYING if the webhook never arrives (CLI down, Stripe
  outage) — handled by **Milestone D3** (recovery worker that re-queries Stripe for
  non-terminal orders + the reservation TTL sweeper). For D2, a stuck PAYING is acceptable
  and visible.
- One more transactional boundary on the inbound side, mirroring the outbox on the
  outbound side: webhook → DB (`payment_events` + order state + outbox row) → Kafka.
- The terminal trace no longer chains from the `POST /orders` request span; it originates
  in the webhook request span (a separate trace), correlated by `order_id` /
  `payment_intent_id`. Acceptable — the payment genuinely happens later.

**Alternatives considered:**
- **Synchronous confirm (read the create/confirm response):** Rejected. Not authoritative
  for async payment methods/SCA, contradicts Stripe's fulfill-on-webhook guidance, and
  couples order outcome to request latency. (We still *create+confirm* synchronously for
  dev convenience, but never *decide the outcome* from that response.)
- **Poll Stripe for PaymentIntent status instead of webhooks:** Rejected for the primary
  path — wasteful and slow. Polling is reserved for D3 *recovery* of orders whose webhook
  was missed.
- **Kafka-based payment events instead of HTTP webhooks:** N/A — Stripe delivers over
  HTTPS webhooks; we translate the outcome into our own `OrderConfirmed`/`OrderFailed`
  Kafka events via the outbox, keeping the internal contract unchanged.

---

## ADR-021: Stripe Elements — card confirmation moves to the browser (realizes ADR-020)

**Status:** Accepted
**Date:** 2026-06-18

**Context:**
ADR-020 made payment asynchronous (webhook-authoritative) and, lacking a card UI,
had the backend **confirm** the PaymentIntent server-side with a test PaymentMethod
(`pm_card_visa`) as a dev stand-in. It explicitly anticipated this ADR: *"when the
storefront gains a real Stripe Elements checkout, only the confirm source changes —
the webhook contract is unchanged."* Milestone E builds that checkout, so the
stand-in is now replaced by a real client-side confirmation.

**Decision:**
**The browser confirms the card with Stripe Elements; the backend never sees card
data.** Concretely, splitting Milestone E by tier (E1 backend, E2 storefront):

- **PAYING step creates an *unconfirmed* PaymentIntent** (`automatic_payment_methods`,
  no `payment_method`, no `confirm`) and returns its `client_secret`. `POST /orders`
  surfaces it in the response (`CreateOrderResponse { order, client_secret }`).
- **The storefront mounts Stripe Elements**, collects the card, and calls
  `stripe.confirmPayment(client_secret, …)`. Stripe processes and emits the same
  webhook as before; **ADR-020's webhook contract is unchanged** —
  `payment_intent.succeeded`/`.payment_failed` still drive CONFIRMED/FAILED, and the
  `payment_events` idempotency guard is untouched.
- **Sequencing:** the order is created and **stock reserved when the user advances to
  the payment step** (a `client_secret` must exist before Elements can mount). An
  out-of-stock checkout therefore fails *before* card entry (exit criterion #3, for
  free); the reserve→pay steps remain idempotent so a retried submit is safe (Stripe
  idempotency key `order-<id>-pi` returns the same intent/secret).
- **Recovery (ADR D3) is unchanged:** the worker still reconciles a stuck PAYING order
  via `PaymentIntent.retrieve`. A PaymentIntent created but never confirmed by the
  browser (abandoned checkout) simply stays `requires_payment_method` until the
  reservation sweeper expires it and the order ages out.

**Consequences:**
- **PCI scope is minimized:** raw card data flows browser→Stripe only; our backend
  handles just the `client_secret` (scoped to one PaymentIntent — its intended use).
- The gateway no longer confirms server-side: `createAndConfirmPayment` is replaced by
  `createPaymentIntent` (returns id + `client_secret`), and the dev-only
  `stripe.test-payment-method` knob is **retired**. Server-side `CardException`
  handling is gone — a decline is now reported to the browser by `confirmPayment` and,
  authoritatively, by the `payment_intent.payment_failed` webhook.
- `POST /orders` response shape changes (adds `client_secret`); the BFF reads it to
  drive Elements, then polls `GET /orders/{id}` for the terminal state.
- The storefront needs Stripe's publishable key (`pk_test_…`) and `@stripe/stripe-js`
  + `@stripe/react-stripe-js` (E2).

**Alternatives considered:**
- **Keep server-side confirm (ADR-020 dev path) in production:** Rejected. It is not a
  real checkout — no card entry, no SCA/3DS path, and it never exercises the
  Elements/PCI boundary that is a core learning goal of this milestone.
- **Stripe Checkout (hosted redirect) instead of Elements:** Rejected for now. Less
  control over the branded checkout UX (the design system is a priority), and a
  redirect flow muddies the single-page trace. Elements keeps checkout on `gaming.gg`.
- **Confirm with a PaymentMethod id collected client-side but confirmed server-side:**
  Rejected. Pulls card-adjacent handling back toward the backend for no benefit over
  Elements' `confirmPayment`.

## ADR-022: Admin console — separate app, shared `@gg/auth`, BFF-forwarded role RBAC

**Status:** Accepted
**Date:** 2026-06-24

**Context:**
Phase 5 (extensions) begins with an **admin dashboard** (per `05-roadmap.md`). Phase 4
(hardening) was deliberately deferred. The platform had no admin surface and **no RBAC
enforcement anywhere**, even though the `gg` realm already defines an `admin` realm role
(ADR-017) that flows through to `session.user.roles`. The first milestone is a
**read-only operations console**: dashboard metrics, browse/search all orders, order
detail, and stock levels. Mutations (product CRUD, restock, cancel/refund) are a later
milestone. Three structural decisions were needed: where the app lives, how auth is
shared, and how admin-only access is enforced across services.

**Decision:**

- **Separate Next.js app** `gg-storefront/apps/admin` (port 3002 — 3001 is Grafana) in the existing
  Turborepo — not an `/admin` route inside the storefront. Keeps customer and operator
  concerns isolated and is the multi-app monorepo exercise the roadmap intends.
- **Shared `@gg/auth` package.** The reusable auth core (Keycloak password-grant/refresh/
  claim-decode client, the NextAuth `createAuthConfig`/`createEdgeAuthConfig` factory, and
  the next-auth type augmentation) is extracted from the storefront into `@gg/auth` and
  consumed by both apps. Each app supplies its own `authorized` rule: the storefront gates
  a few prefixes; the admin app gates the **whole app** to the `admin` role (edge
  middleware for UX + a server-component layout check as the authoritative gate).
  Registration (Keycloak Admin API) stays storefront-only. An `admin`/`admin12345` user
  with the `admin` role is seeded in the realm export; the admin app reuses the existing
  `gg-storefront` Keycloak client.
- **RBAC via a BFF-forwarded `X-User-Roles` header.** The BFF remains the **trust
  boundary** (it validates the Keycloak session), and forwards the caller's realm roles as
  a comma-separated `X-User-Roles` header — mirroring the existing `X-User-Id` pattern.
  New backend admin endpoints live under `/admin/**` and return **403 unless the header
  contains `admin`**: Orders via a Spring `HandlerInterceptor` on `/admin/**`, Inventory
  via a chi middleware on its `/admin` subrouter. New read endpoints: Orders
  `GET /admin/orders` (paginated, status/date filters) + `GET /admin/orders/stats`;
  Inventory `GET /admin/stock` (paginated, low-stock filter). Catalog needs nothing new —
  the admin product list reuses the existing public reads.

**Consequences:**
- One auth definition for both apps; the storefront refactor is behavior-preserving
  (verified by typecheck + build, edge middleware stays free of `server-only`).
- Admin endpoints are consistently shaped (`{"error": …}`, snake_case, the same
  pagination envelope) and independently testable (role guard + queries).
- **Known limitation (accepted for now):** because the backend trusts a BFF-set header, a
  caller with direct network access to a service can forge `X-User-Roles` and reach the
  admin endpoints. This is the *same* trust model already in force for `X-User-Id`
  (Inventory has no auth; Orders trusts the id header) and is acceptable on the
  compose-only network (ADR-013). Hardening — validating the Keycloak JWT and roles in the
  backends themselves (Catalog already validates the token, ADR-017) — is deferred to a
  future ADR if/when these services are exposed beyond the local network.

**Alternatives considered:**
- **`/admin` route inside the storefront:** Rejected. Faster (reuses auth/middleware) but
  mixes operator and customer concerns in one deployable and skips the separate-app
  learning the roadmap calls for.
- **Backend JWT validation now (roles from a verified token, not a header):** Rejected for
  this milestone. More robust, but inconsistent to retrofit onto only the admin paths
  while the rest of the system trusts BFF headers; better done uniformly later.
- **A dedicated `gg-admin` Keycloak client:** Deferred. Reusing the `gg-storefront` client
  (password grant) is enough for a single seeded admin user; a separate client/o-auth flow
  is warranted only when admin auth diverges from the storefront's.
