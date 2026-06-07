# GG Storefront

Customer-facing storefront and BFF for gaming.gg — Next.js 15 Turborepo monorepo.
Open Claude Code sessions from this directory for all storefront work.

## Key paths (relative to this file)
- Architecture & ADRs: `../gg-docs/` — read before making structural decisions
- Design system reference: `../gg-gaming-design-system/` — read before writing any UI
- Design tokens (canonical): `apps/storefront/app/globals.css`
- Mock data: `apps/storefront/lib/mock-data.ts`
- Cart store: `apps/storefront/lib/cart-store.ts`

## Monorepo structure
```
apps/storefront/     # Next.js 15 app (port 3000)
packages/ui/         # @gg/ui — shared cn() utility + GG components
packages/types/      # @gg/types — Protobuf-generated types (Phase 1)
packages/eslint-config/
packages/typescript-config/
```

## Dev commands (run from this directory)
| Command | Description |
|---|---|
| `pnpm dev` | Start storefront in watch mode |
| `pnpm build` | Build all packages |
| `pnpm check-types` | Type-check all packages |
| `pnpm lint` | Lint all packages |
| `pnpm dev --filter=storefront` | Storefront only |

## Stack
- **Framework:** Next.js 16 · App Router · Server Components by default
- **Language:** TypeScript (strict)
- **Styling:** Tailwind CSS v4 + CSS custom properties
- **Components:** shadcn/ui (Radix primitives) — `components.json` configured
- **Icons:** Lucide React
- **State:** Zustand (cart store)
- **Fonts:** Orbitron (display) · Roboto (body) · Roboto Mono (specs/codes)

## App Router conventions
- Server Components by default — add `'use client'` only when needed (hooks, events, browser APIs)
- Data fetching lives in Server Components or Server Actions; never in Client Components
- Route handlers (`app/api/`) act as the BFF layer for external REST calls
- All mutations go through Server Actions (`lib/actions/`)

## React design patterns
Apply these patterns consistently. Mark every usage with a one-line comment so the pattern is visible in code review.

| Pattern | When to use | Example |
|---|---|---|
| **Container / Presenter** | Any page that fetches or owns data | Server Component (container) → Client Component (presenter) |
| **Custom Hook** | Stateful logic reused across ≥2 components | `useCart`, `useProductFilter`, `useCheckoutStep` |
| **Compound Component** | Multi-part UI that shares implicit state | `<Stepper.Root>` + `<Stepper.Step>` for checkout |
| **Optimistic UI** | Mutations where latency would feel slow | Add-to-cart: update store before any async response |
| **Selector subscription** | Zustand — avoid subscribing to the whole store | `useCartStore((s) => s.items)` not `useCartStore()` |
| **Empty state** | Any list or async result | Always pair an empty list with a recovery CTA |

Do **not** use HOCs or render props — hooks and composition cover every case more clearly.

## Responsive design
Every page and component must work on mobile (320px) through desktop (1440px).

- **Mobile-first** approach: base styles target mobile, scale up with `sm:` (640px), `md:` (768px), `lg:` (1024px)
- **Typography:** use `clamp()` for hero text; `sm:` variants for body copy size steps
- **Grids:** always define a mobile fallback column count (e.g. `grid-cols-2 sm:grid-cols-4 lg:grid-cols-8`)
- **Navigation:** hamburger menu on mobile, horizontal links on `md:+`
- **Drawers/modals:** full-width on mobile (`w-full`), fixed width on `sm:+`
- **Padding/spacing:** tighter on mobile (`px-4`), expand at `sm:px-8 lg:px-12`
- **Hide/show:** use `hidden md:flex` / `md:hidden` — never rely on overflow or horizontal scroll
- Test every new page at 375px (iPhone SE), 768px (tablet), and 1280px (desktop) before marking done

## Styling rules
- Tailwind utility classes for layout/spacing/typography
- CSS custom properties (`var(--color-primary)` etc.) for brand colors via `globals.css`
- `clipPath` cuts via `.clip-cyber`, `.clip-cyber-sm`, `.clip-cyber-xs`, `.clip-cyber-btn`, `.clip-cyber-tr` CSS classes
- No inline `style` for color/background/border — use Tailwind classes so `hover:` variants work correctly

## shadcn/ui
- Components land in `apps/storefront/components/ui/` (configured in `components.json`)
- Add components: `npx shadcn@latest add <component>` from `apps/storefront/`
- `cn()` utility comes from `@gg/ui`, not a local file

## Current build status (Phase 0 / early Phase 1)
- Mock data in `lib/mock-data.ts` — replace with REST API calls in Phase 1
- Cart is client-side Zustand only — Redis persistence added in Phase 2
- Auth not yet wired — checkout redirects are placeholders
