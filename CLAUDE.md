# GG Gaming — Gaming E-commerce Platform

Brand: **GG Gaming** | Domain: **gaming.gg**
Learning project built to production standards. Gaming hardware e-commerce
(GPUs, CPUs, peripherals) as a vehicle for distributed systems mastery.

## Read first
Before doing anything, read `docs/` in order (00 through 06). The decision
log (`docs/06-decision-log.md`) captures what was decided and what was
rejected — don't relitigate accepted ADRs without writing a superseding one.

## Learning priorities (ranked, load-bearing)
1. Microservices communication (gRPC, events, saga)
2. Observability (tracing, metrics, logs)
3. IaC & Kubernetes
4. Frontend architecture & UX
5. Payments & transactional integrity
6. Security

## Resolved decisions
- AWS budget: $150-300/mo, 24/7 OK
- Kubernetes: EKS from day one
- Event backbone: SNS/SQS (see ADR-004)
- Team: solo

## Current phase
Phase 0 — Foundation. See `docs/05-roadmap.md` for exit criteria.
Nothing is built yet.

## Stack locked
Go (Catalog, Inventory), Java/Spring (Orders), Next.js 15 + TS + Tailwind +
shadcn (storefront), Terraform/Terragrunt, EKS, ArgoCD, OTel + Grafana stack,
Postgres (RDS), Redis (ElastiCache), SNS/SQS, Stripe test mode.

## Conventions
- One bounded context per service, private databases, gRPC sync + events async
- Transactional outbox for all event publishing
- Idempotency keys on all mutating ops
- ADRs for non-trivial decisions — immutable, supersede don't edit
- Repos: `gg-{domain}` (e.g. `gg-storefront`, `gg-catalog`, `gg-orders`)
- npm packages inside Turborepo: `@gg/{domain}` (e.g. `@gg/ui`, `@gg/types`)
- Docker images, ECR repos, K8s namespaces: `gg-{domain}` (matches repo name)

## Phase 0 next steps
1. Scaffold repo structure (see docs/01-tech-stack.md for Terragrunt layout)
2. proto/ package with Buf + initial contracts
3. local/docker-compose.yml for Postgres + Redis + observability stack
4. Catalog hello-world in Go with OTel wired end-to-end
5. Terragrunt foundation/ layer (VPC, ECR, IAM)

## Design system
For any UI/frontend work, read `gg_gaming_design_system/` to apply the correct brand, colors, typography, and component style before writing any code.

## How to work with me (Claude Code)
- Don't skip reading docs/ — it's the single source of truth
- Push back if I ask for something that contradicts an accepted ADR
- Prefer small PRs with clear exit criteria over big drops
- Always follow best practices for the language and framework in use
- Apply design patterns where genuinely needed — not for their own sake, but when they solve a real structural problem (see per-service patterns in docs/01-tech-stack.md)