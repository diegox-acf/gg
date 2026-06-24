# 05 — Roadmap

## Current Status

**As of 2026-05-08:**

### Phase 0 — complete
- `gg-local/docker-compose.yml`: Postgres ×3, Redis, Kafka (KRaft), Kafka UI, OTel Collector, Prometheus, Loki, Tempo, Grafana
- `gg-storefront/` Next.js 15 monorepo scaffolded: design system implemented, all pages built

### Phase 1 — in progress
- `gg-catalog/` Go service: fully scaffolded (REST, pgx, OTel, migrations + seed data, ADR-012 locked)
- Storefront wired to catalog API via `catalog-client.ts` with mock-data fallback

### Phase 1 remaining
- Run `docker compose up -d` and verify full stack
- Verify OTel traces from catalog appear in Grafana Tempo

---

## Phasing philosophy

Each phase has an **exit criteria** that must be demonstrably met before the next phase starts. No partial credit — if week 1 exit criteria isn't met, week 2 doesn't start. Scope slides, the bar doesn't.

This is the "aggressive 4–6 weeks, core features first" plan. If it slips to 8 weeks, that's fine — what matters is that each phase is actually complete.

## Phase 0 — Local infrastructure stack ✓ COMPLETE

**Goal:** Full local dev stack running with a single command.

**Deliverables (done):**
- `gg-local/docker-compose.yml`: Postgres ×3, Redis, Kafka (KRaft, no ZooKeeper), Kafka UI, OTel Collector, Prometheus, Loki, Tempo, Grafana
- Config files in `gg-local/`: otel-collector.yaml, prometheus.yml, tempo.yaml, loki.yaml, grafana datasource provisioning
- Design system implemented (`docs/08-design-system.md`, applied to storefront)

**Exit criteria (met):** (commands run from `gg-local/`)
1. `docker compose up -d` starts all containers healthy
2. Grafana at `localhost:3001` shows Prometheus, Loki, Tempo datasources connected
3. Kafka UI at `localhost:8090` shows the broker reachable
4. `docker compose down -v && docker compose up -d` cleanly rebuilds from scratch

## Phase 1 — Catalog service + storefront (COMPLETE)

**Goal:** A shopper can browse a real catalog.

**Already done:**
- `gg-catalog` scaffolded: Go 1.22, chi REST, pgx, OTel, migrations + 8 seed products across 8 categories
- Storefront wired to catalog REST API via `catalog-client.ts`; falls back to mock data if catalog is down
- Product, category, and product-detail pages built with design system
- BFF OTel instrumentation (`instrumentation.ts` + `@vercel/otel`); W3C `traceparent`
  propagated to gg-catalog, whose `otelhttp` middleware parents catalog spans to the BFF
- Postgres query spans via `otelpgx` query tracer on the pgx pool

**Done:**
- [x] Run `docker compose up -d` (from `gg-local/`) → migrations → `make run` (from `gg-catalog/`) → storefront shows real products
- [x] OTel trace from catalog appears in Grafana Tempo

**Exit criteria:**
1. ✅ `docker compose up -d` (from `gg-local/`) → catalog migrations → `pnpm dev` — home page shows real products from Postgres
2. ✅ Clicking a product shows its detail page with full specs
3. ✅ A trace from browser → BFF → Catalog → Postgres is visible as a single connected flow in Grafana
   (verified: one trace contains `gg-storefront-bff` render/`fetch` spans → `gg-catalog`
   `http` spans → `otelpgx` `query`/`pool.acquire` Postgres spans)

## Phase 2 — Identity and cart (COMPLETE)

**Goal:** A shopper can register, log in, and assemble a cart.

**Deliverables:**
- ✅ Keycloak deployed via docker-compose (ADR-005 finalized by ADR-017); `gg` realm as code
- ✅ Login/registration from Next.js — custom branded forms via Auth.js Credentials
  provider + Keycloak password grant (not hosted pages); registration via Admin API
- ✅ Session cookie management in BFF (HTTP-only JWT session, token refresh, edge-safe middleware)
- ✅ Redis-backed cart with TTL; guest (7d) and authenticated (90d) cart strategies
- ✅ Cart UI: add/remove/update quantity via Server Actions (no client-side persistence),
  optimistic UI, persistent across sessions for logged-in users
- ✅ JWT validation middleware in Catalog (optional Keycloak JWKS auth; public reads still work)

**Exit criteria:**
1. ✅ A new user can register, log out, log back in (verified end-to-end)
2. ✅ Guest cart persists for 7 days; logging in merges guest cart with any saved user cart
3. ✅ Cart operations are reflected in Redis within 100ms p95 (local Redis, sub-ms)
4. ✅ Logged-out → logged-in flow does not lose cart contents (merge sums quantities, verified)

**Notes:**
- Identity = Keycloak (ADR-017); `demo` / `demo12345` seed user in realm `gg`.
- Auth: `next-auth@5` Credentials provider → Keycloak Direct Access Grant; session is
  identity-only (no raw tokens leaked to the client); `/account` + `/checkout` are protected.
- Cart source of truth is Redis; `CartProvider` is a server-seeded client mirror with
  `useOptimistic`. Guest identity via HTTP-only `gg-cart-id` cookie; merge runs in the
  Auth.js signIn event.
- Catalog validates Bearer tokens when present (`OIDC_ISSUER`); browser→BFF→Catalog→Postgres
  tracing remains connected.

## Phase 3 — The saga (Week 4)

**Goal:** Checkout works end to end, including the distributed saga.

**Deliverables:**
- Orders service (Java/Spring): full saga orchestrator, outbox publisher, Kafka consumer
- Inventory service (Go): reservation model, REST API, Kafka event consumers
- Stripe test mode integration (payment intents)
- Kafka topics created, consumer groups configured
- Stripe webhook handler (HTTP endpoint in Orders service)
- Distributed trace propagation across REST and Kafka (context propagation via HTTP headers and message headers)
- Saga recovery worker for mid-saga crashes
- Reservation sweeper for expired reservations
- End-to-end test: create cart → checkout → see CONFIRMED order

**Exit criteria:**
1. Happy path checkout works: cart → address → pay → confirmation page → order visible in account
2. Failure path — declined card — correctly releases inventory, marks order FAILED, shows user error
3. Failure path — insufficient stock — fails fast without payment attempt
4. Killing Orders pod during the PAYING state results in the saga completing correctly after restart, no double charges
5. Full checkout trace is a single connected flow in Grafana, across browser, BFF, Orders, Inventory, Stripe webhook

**Milestone status** (sequenced into 5 PRs — see ADR-018 and `01-tech-stack.md`):
- ✅ **A — Inventory service (Go).** Stock + reservations, optimistic locking (CAS),
  transactional outbox, OTel. Merged to `main` (`gg-inventory/`).
- ✅ **B — Orders service (Java/Spring Boot 3.5).** Scaffold + `POST /orders` (PENDING order,
  Catalog price snapshot, `OrderPlaced` outbox). Merged to `main` 2026-06-11 (`gg-orders/`);
  live Orders→Catalog→Postgres trace verified in Tempo.
- ✅ **C — Event backbone.** Outbox→Kafka pollers both services (Orders spring-kafka,
  Inventory franz-go; `acks=all` + idempotent, full W3C traceparent stored & propagated);
  topics provisioned via a `kafka-init` container (auto-create off). Orders idempotent
  consumer of `inventory.stock-reserved` (`consumed_events` dedup, manual commit, retry→DLQ).
  Delivery semantics per **ADR-019** (effectively-once, not Kafka EOS). The `OrderPlaced` +
  terminal-event consumers and Inventory's commit/release consumer are deferred to D.
  Full publish→consume→dedup→trace verified live.
- ✅ **D — Saga orchestration + Stripe.** Orchestrator state machine (PENDING→RESERVING→PAYING→
  CONFIRMED|FAILED), Stripe PaymentIntents + **async webhook-driven** confirmation (**ADR-020**),
  recovery worker + reservation sweeper. Includes the C-deferred consumers (Orders ←
  `OrderConfirmed`/`OrderFailed`, Inventory commit/release off terminal events). Split D1/D2/D3,
  all merged to `main` 2026-06-18; verified live (happy/declined/idempotent-resend; missed-webhook
  recovery; sweeper expiry).
- ⬜ **E — BFF checkout wiring.** Storefront checkout → confirmation → `/account/orders`.

Reservation is **synchronous REST**, terminal commit/release is **Kafka** — see **ADR-018**.

**This is the pivotal phase.** Everything else is setup for this.

## Phase 4 — Hardening and polish (Week 5)

> **Status: deferred** (decision 2026-06-24). Phase 4 is skipped for now in favor of
> Phase 5 extensions (admin dashboard first). Revisit before any real launch.

**Goal:** The system is demonstrably robust and observable.

**Deliverables:**
- Load test with k6: steady-state and flash-sale scenarios
- DLQ (dead-letter topic) monitoring and alerting rules
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

- **Admin dashboard** (Next.js, separate app in monorepo) — **🔄 in progress** (ADR-022).
  Milestone 1 (read-only ops console) built: `apps/admin` (port 3002) gated to the
  `admin` role, shared `@gg/auth` package, backend admin read endpoints + `X-User-Roles`
  RBAC (Orders `/admin/orders`+`/stats`, Inventory `/admin/stock`). Dashboard, orders
  list/detail, inventory, and products pages wired to live data. Code/tests/build green;
  live end-to-end demo (Keycloak admin user re-import + full stack) pending.
- **Notifications service** (Node.js): real email via SES
- **Search service** (Go): OpenSearch integration
- **Separate Payments service** (Java): extract from Orders, practice service decomposition
- **Service mesh** (Istio or Linkerd): mTLS, traffic policies (via docker-compose networks)
- **Chaos testing** with manual container kills and network partition simulation
- **k6 load profiles** for steady-state and flash-sale scenarios

## What we will NOT do

To prevent scope creep, the following are explicitly deferred indefinitely:

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
