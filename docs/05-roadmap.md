# 05 — Roadmap

## Phasing philosophy

Each phase has an **exit criteria** that must be demonstrably met before the next phase starts. No partial credit — if week 1 exit criteria isn't met, week 2 doesn't start. Scope slides, the bar doesn't.

This is the "aggressive 4–6 weeks, core features first" plan. If it slips to 8 weeks, that's fine — what matters is that each phase is actually complete.

## Phase 0 — Foundation (Week 1)

**Goal:** End-to-end infrastructure skeleton with nothing business-specific deployed. Prove the plumbing works before we plug anything into it.

**Deliverables:**
- Monorepo (Turborepo) initialized for frontends, separate repos for backend services
- Terragrunt layout scaffolded: foundation (VPC, IAM, ECR), platform (EKS, ArgoCD, observability stack)
- One "hello-world" Go service deployed to EKS via ArgoCD, reachable through ingress
- OpenTelemetry collector running, Grafana + Tempo + Prometheus + Loki installed
- GitHub Actions CI running on the hello-world service: build, test, lint, push image to ECR
- Structured logs, metrics, and a trace visible in Grafana from the hello-world service
- A documented teardown procedure that cleanly deletes everything

**Exit criteria:**
1. `git push` → image builds in CI → pushed to ECR → ArgoCD syncs → service is live
2. A request to the hello-world service produces a trace visible in Grafana within 30 seconds
3. `terragrunt run-all destroy` cleanly removes everything and we can rebuild

**Parallel design track (runs alongside Phase 0, does not block exit criteria):**
- Use `docs/07-design-brief.md` as context for a Claude Design session
- Define brand style: color palette, typography, spacing, component patterns
- Produce screen mockups for the storefront golden path (Home → PDP → Cart → Checkout → Confirmation)
- Capture output in `docs/08-design-system.md` (color tokens, typography scale, component inventory)
- Output feeds directly into Phase 1: Tailwind config, shadcn theme, `packages/ui` setup

**Risk:** This phase is deceptively time-consuming. Budget a full week. It's the phase most likely to slip; do not start Phase 1 until this is rock solid. Design track can continue into Phase 1 start if needed — just have the color tokens and typography locked before writing the first component.

## Phase 1 — Catalog and storefront (Week 2)

**Goal:** A shopper can browse a real catalog.

**Deliverables:**
- Catalog service (Go): gRPC server, REST gateway, Postgres schema, seed data (~50 products)
- Protobuf contracts defined in shared `proto/` repo; code generation for Go, Java, TypeScript working
- Next.js storefront shell with product listing, category filter, product detail page
- shadcn/ui components integrated, Tailwind themed
- Catalog service Terragrunt module (RDS, SQS placeholder, ECR, IRSA)
- Observability fully wired on Catalog: traces, metrics, logs with trace correlation

**Exit criteria:**
1. Navigating to `/` shows a grid of real products served from Postgres
2. Clicking a product shows its detail page with full specs
3. A trace from browser → BFF → Catalog → Postgres is visible as a single connected flow in Grafana
4. Catalog service restarts cleanly on pod kill

## Phase 2 — Identity and cart (Week 3)

**Goal:** A shopper can register, log in, and assemble a cart.

**Deliverables:**
- Keycloak deployed on EKS (or Cognito provisioned via Terraform — decision pending, see ADR-005)
- OIDC login flow working from Next.js
- Session cookie management in BFF
- Redis-backed cart with TTL; guest and authenticated cart strategies
- Cart UI: add/remove/update quantity, persistent across sessions for logged-in users
- JWT validation middleware in Catalog (hardens the service even though catalog is mostly public)

**Exit criteria:**
1. A new user can register, log out, log back in
2. Guest cart persists for 7 days; logging in merges guest cart with any saved user cart
3. Cart operations are reflected in Redis within 100ms p95
4. Logged-out → logged-in flow does not lose cart contents

## Phase 3 — The saga (Week 4)

**Goal:** Checkout works end to end, including the distributed saga.

**Deliverables:**
- Orders service (Java/Spring): full saga orchestrator, outbox publisher, SQS consumer
- Inventory service (Go): reservation model, gRPC API, event consumers
- Stripe test mode integration (payment intents)
- SNS topics and SQS queues provisioned, one per consumer
- Lambda for Stripe webhook ingestion
- Distributed trace propagation across gRPC and SNS/SQS (context propagation via message attributes)
- Saga recovery worker for mid-saga crashes
- Reservation sweeper for expired reservations
- End-to-end test: create cart → checkout → see CONFIRMED order

**Exit criteria:**
1. Happy path checkout works: cart → address → pay → confirmation page → order visible in account
2. Failure path — declined card — correctly releases inventory, marks order FAILED, shows user error
3. Failure path — insufficient stock — fails fast without payment attempt
4. Killing Orders pod during the PAYING state results in the saga completing correctly after restart, no double charges
5. Full checkout trace is a single connected flow in Grafana, across browser, BFF, Orders, Inventory, Stripe webhook

**This is the pivotal phase.** Everything else is setup for this.

## Phase 4 — Hardening and polish (Week 5)

**Goal:** The system is demonstrably robust and observable.

**Deliverables:**
- Load test with k6: steady-state and flash-sale scenarios
- HPA tuned for each service
- DLQ monitoring and alerting rules
- Grafana dashboards for each service (RED metrics + domain metrics)
- Alertmanager → Slack with at least 5 meaningful alerts
- Chaos test documented: kill each service mid-operation, verify recovery
- README updates, architecture diagram exported, demo script written

**Exit criteria:**
1. Load test sustains target RPS without errors; p95 latencies within budget
2. Alerts fire correctly for induced failures
3. A new engineer could read the docs and run the system locally in under an hour
4. The demo video is recorded

## Phase 5 — Extensions (Week 6+, optional)

Pick from this list based on remaining time and what you want to learn next:

- **Admin dashboard** (Next.js, separate app in monorepo)
- **Notifications service** (Node.js): real email via SES
- **Search service** (Go): OpenSearch integration
- **Separate Payments service** (Java): extract from Orders, practice service decomposition
- **Service mesh** (Istio or Linkerd): mTLS, traffic policies
- **Argo Rollouts** for canary deployments
- **Chaos Mesh** for automated chaos experiments
- **Cost dashboards** (AWS Cost Explorer → Grafana)
- **Multi-region RDS read replica** for disaster recovery practice

## What we will NOT do

To prevent scope creep, the following are explicitly deferred indefinitely:

- Kafka (SNS/SQS is enough; ADR-004)
- Multi-tenancy
- Mobile apps
- Third-party integrations beyond Stripe (no analytics SDKs, no customer support tools)
- Accessibility audit beyond sensible defaults
- Internationalization
- Any feature that doesn't directly serve the top 3 learning goals without also advancing goals 4–6

## Weekly cadence

- **Monday:** review previous week's exit criteria, plan the week's PRs
- **Wed/Thu:** mid-week checkpoint — on track or sliding?
- **Friday:** tag the week's work, update this doc if scope shifted, update decision log if decisions changed

## Slip policy

If a phase is going to slip by more than 50%, stop and reassess:
1. Is the exit criteria too ambitious? Tighten it.
2. Is there a blocker? Document it and find a smaller learning that gets around it.
3. Is the scope wrong? Update doc 00 explicitly, don't silently drift.

Silent slippage is how side projects die. Explicit slippage is how they ship.
