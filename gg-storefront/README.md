# GG Gaming — Storefront

> Customer-facing storefront and BFF for [gaming.gg](https://gaming.gg) — a gaming PC hardware e-commerce platform built to production standards.

## Overview

This is the frontend monorepo for GG Gaming, built with [Turborepo](https://turborepo.dev). It contains the Next.js storefront app and all shared packages. Backend services (`gg-catalog`, `gg-orders`, `gg-inventory`) live in their own repositories.

## Tech Stack

| Concern | Technology |
|---|---|
| Framework | [Next.js 15](https://nextjs.org) (App Router, Server Components) |
| Language | [TypeScript](https://www.typescriptlang.org) (strict mode) |
| Styling | [Tailwind CSS](https://tailwindcss.com) |
| Components | [shadcn/ui](https://ui.shadcn.com) (Radix primitives) |
| Fonts | Orbitron + Roboto (Google Fonts via `next/font`) |
| Monorepo | [Turborepo](https://turborepo.dev) |
| Package manager | [pnpm](https://pnpm.io) |
| Auth | [Auth.js v5](https://authjs.dev) (OIDC — Keycloak / Cognito) |
| Backend calls | [ConnectRPC](https://connectrpc.com) (type-safe gRPC from Server Components) |

## Repository Structure

```
gg-storefront/
├── apps/
│   └── storefront/          # Next.js 15 — customer-facing store (port 3000)
│       ├── app/             # App Router routes
│       │   ├── page.tsx                          # Home
│       │   ├── category/[slug]/page.tsx          # Category listing
│       │   ├── product/[slug]/page.tsx           # Product detail
│       │   ├── checkout/page.tsx                 # Checkout (3-step)
│       │   ├── order/[id]/confirmation/page.tsx  # Order confirmation
│       │   └── account/orders/                   # Order history + detail
│       ├── components/      # Storefront-specific components
│       └── lib/             # API clients, Server Actions, Auth config
│
└── packages/
    ├── ui/                  # @gg/ui — shared shadcn component library
    ├── types/               # @gg/types — Protobuf-generated TypeScript types
    ├── eslint-config/       # @gg/eslint-config — shared ESLint rules
    └── typescript-config/   # @gg/typescript-config — shared tsconfig bases
```

## Prerequisites

- [Node.js](https://nodejs.org) >= 18
- [pnpm](https://pnpm.io) >= 9

```bash
npm install -g pnpm
```

## Getting Started

```bash
# Clone the repo
git clone https://github.com/<your-org>/gg-storefront.git
cd gg-storefront

# Install dependencies
pnpm install

# Start all apps in development mode
pnpm dev
```

The storefront will be available at [http://localhost:3000](http://localhost:3000).

## Available Scripts

Run from the repository root:

| Command | Description |
|---|---|
| `pnpm dev` | Start all apps in watch mode |
| `pnpm build` | Build all apps and packages |
| `pnpm lint` | Lint all apps and packages |
| `pnpm check-types` | Type-check all apps and packages |
| `pnpm format` | Format all files with Prettier |

Run a specific app only:

```bash
pnpm dev --filter=storefront
pnpm build --filter=storefront
```

## Design System

Brand, color tokens, typography, and component guidelines are documented in:

- [`gg-gaming-design-system/README.md`](../gg-gaming-design-system/README.md) — full design system reference
- [`../gg-docs/08-design-system.md`](../gg-docs/08-design-system.md) — canonical token summary

Primary font: **Orbitron** (display/brand) + **Roboto** (body) + **Roboto Mono** (specs/codes).
Primary accent: `#d4ff00`.

## Related Repositories

| Repo | Description |
|---|---|
| [`gg-catalog`](https://github.com/<your-org>/gg-catalog) | Go — Catalog service (gRPC) |
| [`gg-orders`](https://github.com/<your-org>/gg-orders) | Java — Orders service + saga orchestrator |
| [`gg-inventory`](https://github.com/<your-org>/gg-inventory) | Go — Inventory service (gRPC) |
| [`gg-proto`](https://github.com/<your-org>/gg-proto) | Shared Protobuf definitions (Buf) |
| [`gg-infra`](https://github.com/<your-org>/gg-infra) | Terraform / Terragrunt (AWS EKS) |

## Documentation

Full project documentation lives in [`../gg-docs/`](../gg-docs/):

| Doc | Description |
|---|---|
| [00 — Vision & Scope](../gg-docs/00-vision-and-scope.md) | What we're building and why |
| [01 — Tech Stack](../gg-docs/01-tech-stack.md) | Stack decisions with rationale |
| [02 — Business Logic](../gg-docs/02-business-logic-and-use-cases.md) | Domain model and user flows |
| [03 — Architecture](../gg-docs/03-architecture.md) | System design and service communication |
| [05 — Roadmap](../gg-docs/05-roadmap.md) | Phased delivery plan |
| [07 — Design Brief](../gg-docs/07-design-brief.md) | UI screens and user flows |
| [08 — Design System](../gg-docs/08-design-system.md) | Color tokens, typography, components |
