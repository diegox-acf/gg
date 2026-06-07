# GG Gaming — Gaming E-commerce Platform

Brand: **GG Gaming** | Domain: **gaming.gg**
Learning project built to production standards. Gaming hardware e-commerce
(GPUs, CPUs, peripherals) as a vehicle for distributed systems mastery.

## Read first
Before doing anything, read `gg-docs/` in order (00 through 06). The decision
log (`gg-docs/06-decision-log.md`) captures what was decided and what was
rejected — don't relitigate accepted ADRs without writing a superseding one.
For DB schema work, also read `gg-docs/09-data-model.md`.

## Learning priorities (ranked, load-bearing)
1. Microservices communication (events, saga)
2. Observability (tracing, metrics, logs)
3. Docker Compose & container orchestration
4. Frontend architecture & UX
5. Payments & transactional integrity
6. Security

## Resolved decisions
- Event backbone: Kafka (see ADR-014)
- Infrastructure: docker-compose only, local/dev forever (see ADR-013)
- Team: solo

## Current phase
Phase 1 — Catalog + storefront in progress. See `gg-docs/05-roadmap.md` for status.

## Stack locked
Go (Catalog, Inventory), Java/Spring (Orders), Next.js 15 + TS + Tailwind +
shadcn (storefront), docker-compose, OTel + Grafana stack,
Postgres, Redis, Kafka, Stripe test mode.

## Monorepo structure
Everything lives in this single repo. Each service is a top-level directory:
```
gg/
├── gg-catalog/      # Go catalog service
├── gg-inventory/    # Go inventory service
├── gg-orders/       # Java orders service
├── gg-storefront/   # Next.js BFF + storefront
├── gg-docs/         # Architecture docs and ADRs
├── Makefile         # Root targets: catalog-build, infra-up, etc.
└── .github/workflows/  # Per-service CI workflows + release tagging
```

## Branching and versioning
Branch convention: `gg-{service}/{version}` (e.g. `gg-catalog/1.0.0`).
Versions are set manually. On merge to `main`, the release workflow
auto-creates a git tag `gg-{service}/v{version}`.

Each service has its own GitHub Actions workflow triggered by pushes to its
branch pattern. See `.github/workflows/` for details.

## Conventions
- One bounded context per service, private databases, REST sync + events async
- Transactional outbox for all event publishing
- Idempotency keys on all mutating ops
- ADRs for non-trivial decisions — immutable, supersede don't edit
- Service directories: `gg-{domain}` (e.g. `gg-storefront`, `gg-catalog`)
- npm packages inside Turborepo: `@gg/{domain}` (e.g. `@gg/ui`, `@gg/types`)
- Docker images: `gg-{domain}` (matches directory name)

## Phase 0 next steps
1. docker-compose.yml with full infra stack (Postgres ×3, Redis, Kafka, observability)
2. Catalog hello-world in Go with OTel wired end-to-end

## Design system
For any UI/frontend work, read `gg-gaming-design-system/` to apply the correct brand, colors, typography, and component style before writing any code.

## How to work with me (Claude Code)
- Don't skip reading gg-docs/ — it's the single source of truth
- Push back if I ask for something that contradicts an accepted ADR
- Prefer small PRs with clear exit criteria over big drops
- Always follow best practices for the language and framework in use
- Apply design patterns where genuinely needed — not for their own sake, but when they solve a real structural problem (see per-service patterns in gg-docs/01-tech-stack.md)