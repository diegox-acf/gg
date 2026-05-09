# Project Documentation

> **Last updated:** 2026-05-09

This folder contains the planning, architecture, and decision documentation for the gaming e-commerce platform. Read these in order if you're new to the project.

## Documents

| # | Document | Purpose |
|---|---|---|
| 00 | [Vision and scope](./00-vision-and-scope.md) | What we're building, why, and what's explicitly out of scope |
| 01 | [Tech stack](./01-tech-stack.md) | Languages, frameworks, infrastructure — with rationale |
| 02 | [Business logic and use cases](./02-business-logic-and-use-cases.md) | Domain model, actors, user stories, core flows |
| 03 | [Architecture](./03-architecture.md) | Services, communication patterns, data stores, observability |
| 04 | [Scalability and NFRs](./04-scalability-and-nfr.md) | Non-functional requirements, load targets, scaling strategy |
| 05 | [Roadmap](./05-roadmap.md) | Phased delivery plan with exit criteria |
| 06 | [Decision log](./06-decision-log.md) | Architecture Decision Records — what was decided and what was rejected |
| 07 | [Design brief](./07-design-brief.md) | Storefront screens, user flows, and product context for UI design |
| 08 | [Design system](./08-design-system.md) | Canonical tokens: colors, typography, spacing, components, motion |
| 09 | [Data model](./09-data-model.md) | Full DB schema for gg_catalog, gg_orders, gg_inventory — MVP sealed |

## How to use these docs

- **Before coding anything**: re-read 00, 01, and 05 to confirm you're still inside scope.
- **When making a non-trivial decision**: add an ADR to doc 06. Future-you will thank present-you.
- **When scope wants to creep**: go to doc 00, find the non-goals section, and either say no or consciously update the doc.
- **When touching the DB**: read doc 09 first. Schema is MVP-sealed.
