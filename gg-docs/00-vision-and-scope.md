# 00 — Vision and Scope

## Why this project exists

This is a learning project built to production standards. The domain (**GG Gaming** — a gaming hardware e-commerce store at `gaming.gg`) is a vehicle; the real goal is hands-on mastery of distributed systems, observability, and container orchestration. The product will work end-to-end, but "ship a viable business" is explicitly not the main goal — "exercise every meaningful pattern in a modern backend stack" is.

Treating it as a real product (real auth, real payments in test mode, real observability, real IaC) is what makes the learning stick. A toy project teaches toy lessons.

## Learning goals, ranked

This ranking is load-bearing. Every scope decision should be traceable back to it.

1. **Microservices communication** — gRPC, events, saga pattern, idempotency, outbox
2. **Observability** — distributed tracing, metrics, logs, dashboards, alerting
3. **Container orchestration** — docker-compose, service networking, local dev tooling
4. **Frontend architecture and UX** — Next.js App Router, server components, shadcn
5. **Payments and transactional integrity** — Stripe integration, saga compensations
6. **Security** — auth, secrets management, IAM

Priorities 1–4 get deep exploration. Priorities 5–6 get competent-but-not-exhaustive treatment in the MVP.

## Product vision (one paragraph)

**GG Gaming** (`gaming.gg`) is a storefront for gaming hardware (mice, keyboards, GPUs, CPUs, motherboards, etc.) where customers can browse a catalog, register an account, add items to a cart, check out with a test payment, and receive order confirmation. Behind the storefront, an event-driven microservices architecture orchestrates inventory reservation, payment capture, and order fulfillment with full compensating transactions on failure. Operators observe the whole system through unified tracing, metrics, and logs.

## Target users (MVP)

- **Shopper** — browses catalog, registers, buys items.
- **Operator** (you, via Grafana) — observes system health, debugs sagas, investigates failures.

Admin dashboard for non-technical operators is explicitly deferred.

## In scope for MVP (4–6 weeks)

- Product catalog with ~50 seeded gaming products across categories
- User registration and login (managed identity: Keycloak or Cognito)
- Session-based cart stored in Redis
- Checkout flow with saga: inventory reservation → payment capture → order confirmation
- Stripe test mode integration (one happy path + at least one failure path tested)
- Three backend services (Catalog, Orders, Inventory) running via docker-compose
- Full observability: distributed tracing, metrics, structured logs, dashboards
- CI/CD: GitHub Actions (build + test); local docker-compose for runtime
- Local infrastructure stack: docker-compose with Postgres, Redis, Kafka, and full observability (OTel, Prometheus, Loki, Tempo, Grafana)

## Non-goals (explicitly out of scope for MVP)

Keep this list as a weapon against scope creep.

- **Admin dashboard / CMS** — deferred to Phase 2
- **Real email delivery** — log-only in MVP; real SES/SendGrid in Phase 2
- **Product search service** — MVP uses SQL LIKE queries; OpenSearch in Phase 2
- **Recommendations, reviews, ratings** — not in MVP
- **Wishlist, coupons, promotions** — not in MVP
- **Shipping calculations, multiple shipping options** — flat rate hardcoded
- **Tax calculations** — flat percentage hardcoded
- **Multi-region deployment** — single region
- **Multi-currency** — USD only
- **Fraud detection, 3DS, disputes** — rely on Stripe defaults
- **Separate Payments microservice** — logic lives inside Orders for MVP
- **Separate Notifications microservice** — deferred to Phase 2
- **Mobile app** — web responsive only
- **i18n / l10n** — English only

## Success criteria for MVP

The MVP is done when all of the following are demonstrably true:

1. A new user can register, browse, add to cart, check out, and see an order confirmation.
2. A failing payment (Stripe test card that declines) triggers the compensating saga: inventory is released, the order is marked failed, no money is captured.
3. A single Grafana trace view shows the full request path from browser → BFF → Orders → Inventory → Stripe for a successful checkout.
4. Killing a service container mid-saga results in the saga completing or compensating correctly after restart (no stuck orders, no double charges).
5. All infrastructure is defined in `gg-local/docker-compose.yml` and can be torn down and rebuilt from scratch with `docker compose down -v && docker compose up -d` (run from `gg-local/`).
6. CI pipeline runs on every PR (build, test, lint).
7. The whole stack can be spun up and demoed with `cd gg-local && docker compose up -d`.
