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

## Pending decisions (need user input before finalizing)

These are tracked as TODOs until resolved. Blocking Phase 0 kickoff.

### PD-01: AWS budget comfort zone
**Options:**
- (a) $150–300/mo is fine for 24/7 learning env
- (b) Tight — aggressive optimization (spot, single NAT, nightly teardown)
- (c) Minimal — LocalStack and kind; AWS only for demo moments
- (d) Free tier only — local K8s for all learning

**Impact:** Determines whether EKS is day-one, whether Keycloak or Cognito, whether we run the observability stack in-cluster or use managed.

### PD-02: Kubernetes strategy
**Options:**
- (a) EKS from day one
- (b) Start on ECS Fargate, migrate to EKS later
- (c) kind/k3d locally, EKS only for final demo

**Impact:** Phase 0 scope and cost. EKS day-one is the richest learning but also the most expensive.

### PD-03: Event backbone
**Options:**
- (a) SNS/SQS (see ADR-004)
- (b) Kafka (MSK)
- (c) SNS/SQS now, add Kafka in Phase 5

**Impact:** Finalizes ADR-004. Current recommendation is (a).

### PD-04: Team size
**Options:**
- (a) Solo
- (b) 1–2 collaborators
- (c) Small team (3–5)

**Impact:** Affects branching strategy, code review flow, documentation rigor.

### PD-05: Guest checkout?
Not blocking Phase 0, but decide before Phase 3. Tentative: no guest checkout in MVP.

### PD-06: Order number format?
Not blocking. Tentative: human-friendly (e.g. `GMR-2026-00042`).
