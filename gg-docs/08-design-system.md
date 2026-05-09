# 08 — Design System

> Canonical design tokens and brand rules for GG Gaming (`gaming.gg`).
> Source of truth for all UI work. When in doubt, check here first.
>
> The full interactive UI kit lives in `gg-gaming-design-system/`. Read that
> directory alongside this doc — it contains the prototype, component previews,
> and the Claude Code skill definition.

---

## Aesthetic

**"Cyborg dark"** — sharp, high-performance, tech-forward.

The defining visual signature is `clipPath` polygon cuts on interactive
elements (buttons, cards, inputs, badges, logo). No pill shapes, no heavy
border-radius. Angular cut corners create the mechanical precision feel.

Dark navy-black base. Single hot orange-red accent. No gradients on surfaces.
No texture, no noise. Fast micro-interactions, no bounces.

---

## Color tokens

These are the canonical values. The `colors_and_type.css` file in
`gg-gaming-design-system/` contains the full CSS custom property definitions.

### Backgrounds (3 tiers)

| Token | Value | Use |
|---|---|---|
| `--color-bg-page` | `#070a0e` | Page background |
| `--color-bg-surface` | `#0d1117` | Cards, panels |
| `--color-bg-elevated` | `#141b24` | Modals, drawers, dropdowns |
| `--color-bg-overlay` | `rgba(7,10,14,0.80)` | Backdrop behind drawers/modals |

### Brand / Primary

| Token | Value | Use |
|---|---|---|
| `--color-primary` | `#ff3500` | CTAs, active states, brand marks, accent |
| `--color-primary-hover` | `#e02d00` | Button hover |
| `--color-primary-muted` | `rgba(255,53,0,0.15)` | Subtle accent backgrounds |

### Borders

| Token | Value | Use |
|---|---|---|
| `--color-border` | `#1e2938` | Default border on all elements |
| `--color-border-strong` | `#2e3d50` | Emphasized/hover borders |
| `--color-border-accent` | `rgba(255,53,0,0.40)` | Card hover border |

### Text / Foreground

| Token | Value | Use |
|---|---|---|
| `--color-fg-1` | `#f0f4f8` | Primary text |
| `--color-fg-2` | `#8a9bb0` | Secondary / muted text |
| `--color-fg-3` | `#4a5a6a` | Disabled, placeholder |
| `--color-fg-inverse` | `#070a0e` | Text on accent/light backgrounds |

### Semantic

| State | Color | Muted bg | Use |
|---|---|---|---|
| Success | `#16c77a` | `rgba(22,199,122,0.12)` | In Stock, confirmations |
| Warning | `#f5a623` | `rgba(245,166,35,0.12)` | Low Stock |
| Danger | `#ef4444` | `rgba(239,68,68,0.12)` | Errors, Out of Stock |
| Info | `#38bdf8` | `rgba(56,189,248,0.12)` | Informational |

---

## Typography

> **Canonical fonts: Orbitron + Roboto.** The `colors_and_type.css` token file
> lists Barlow/DM Sans — those are outdated. The built components and font
> assets use Orbitron and Roboto exclusively.

### Font stacks

| Role | Font | Fallback |
|---|---|---|
| Display / Brand | `'Orbitron'` | `sans-serif` |
| Body / UI | `'Roboto'` | `system-ui, sans-serif` |
| Mono / Specs | `'Roboto Mono'` | `'Courier New', monospace` |

Font assets are in `gg-gaming-design-system/assets/fonts/`.

### Where each font is used

| Font | Used for |
|---|---|
| Orbitron | Logo, hero headline, section headings, price display, order numbers, button labels, badges |
| Roboto | Body copy, product names, nav links, descriptions, form labels, helper text |
| Roboto Mono | Spec values, SKUs, order IDs, price decimals |

### Type scale

| Token | px | Use |
|---|---|---|
| `--text-xs` | 12px | Badges, eyebrow labels |
| `--text-sm` | 14px | Body small, helper text, form labels |
| `--text-base` | 16px | Default body |
| `--text-md` | 18px | Lead text |
| `--text-lg` | 24px | H4 |
| `--text-xl` | 32px | H3 |
| `--text-2xl` | 40px | H2 |
| `--text-3xl` | 56px | H1 |
| `--text-4xl` | 72px | Display |
| `--text-5xl` | 96px | Hero display |
| `--text-hero` | 120px | Max hero (clamp to viewport) |

---

## Spacing

Base unit: **4px**. All spacing is a multiple of 4.

| Token | Value |
|---|---|
| `--space-1` | 4px |
| `--space-2` | 8px |
| `--space-3` | 12px |
| `--space-4` | 16px |
| `--space-6` | 24px |
| `--space-8` | 32px |
| `--space-12` | 48px |
| `--space-16` | 64px |
| `--space-24` | 96px |
| `--space-32` | 128px |

**Layout:**
- Content max-width: `1440px`
- Horizontal padding: `48px` desktop, `16px` mobile
- Grid: 12-column, `24px` gutters (desktop); single column (mobile)

---

## Shape — clipPath cuts

The signature element. Every interactive surface uses angled polygon cuts
instead of rounded corners.

```css
/* Standard element — buttons, inputs, badges */
clip-path: polygon(0 0, calc(100% - 9px) 0, 100% 9px, 100% 100%, 9px 100%, 0 calc(100% - 9px));

/* Cards */
clip-path: polygon(0 0, calc(100% - 14px) 0, 100% 14px, 100% 100%, 14px 100%, 0 calc(100% - 14px));

/* Small elements (badges, chips) */
clip-path: polygon(0 0, calc(100% - 5px) 0, 100% 5px, 100% 100%, 5px 100%, 0 calc(100% - 5px));
```

**Border radius fallback** (for elements that don't use clipPath):
- `--radius-sm: 4px` — badges, chips
- `--radius-md: 6px` — inputs, buttons
- `--radius-lg: 8px` — cards, containers
- `--radius-xl: 12px` — modals, large surfaces

---

## Elevation & shadows

| Level | Value | Use |
|---|---|---|
| 0 (flat) | `none` | Cards at rest |
| 1 (hover) | `0 4px 12px rgba(0,0,0,0.4)` | Card hover |
| 2 (float) | `0 8px 32px rgba(0,0,0,0.6)` | Dropdowns, drawers |
| 3 (modal) | `0 16px 64px rgba(0,0,0,0.8)` | Modals, overlays |
| Accent | `0 4px 20px rgba(255,53,0,0.25)` | Focused CTA, active logo |

---

## Motion

| Token | Value | Use |
|---|---|---|
| `--ease-out` | `cubic-bezier(0.16, 1, 0.3, 1)` | Default — fast out, punchy |
| `--ease-in` | `cubic-bezier(0.7, 0, 0.84, 0)` | Exit transitions |
| `--ease-inout` | `cubic-bezier(0.85, 0, 0.15, 1)` | Panels, drawers |
| `--duration-fast` | `80ms` | Press states |
| `--duration-base` | `150ms` | Hover, focus |
| `--duration-slow` | `250ms` | State changes |
| `--duration-enter` | `350ms` | Panels, drawers entering |

Rules:
- Hover: color/border shift + subtle lift. Never opacity fade.
- Press: `scale(0.97)` + darken, `80ms`.
- No bounce easing. No page transitions in MVP.

---

## Component rules

### Buttons
- Primary: `#ff3500` background, `--fg-inverse` text, clipPath cut, Orbitron font, uppercase, `0.1em` tracking
- Hover: shifts to `#e8ff1a` (yellow-green flash) — distinctive intentional choice
- Secondary: transparent bg, accent border on hover
- No pill shapes

### Cards (Product)
- Background `#0d1117`, `1px solid #1e2938` border, clipPath cut corners
- Hover: border → `rgba(255,53,0,0.40)`, `translateY(-3px)`, accent glow shadow
- Out-of-stock: `opacity: 0.55`, hover disabled
- HUD corner decorations on hover (top-left / bottom-right `1px` accent lines)
- Scan sweep animation on hover

### Inputs
- Background `#141b24`, border `#1e2938` → `#ff3500` on focus
- No focus glow/ring — border color change only
- Orbitron label (9px, uppercase, tracked), Roboto input text

### Badges (stock status)
- ClipPath cut, dot indicator, Roboto 11px semi-bold
- In Stock: `#16c77a` / Warning: `#f5a623` / Out: `#ef4444`
- Low Stock dot pulses

### Nav
- Sticky, `60px` height, backdrop blur `14px`
- Logo: "GG" in Orbitron on `#ff3500` clipPath block + "GAMING" in Roboto
- Nav links: Roboto uppercase, animated underline scale on hover
- Cart badge: Orbitron 9px on `#ff3500` circle

### Icons
- **Lucide Icons** — stroke-only, `1.5px` weight, 24×24
- Sizes: 16px (inline), 20px (button), 24px (nav/standalone), 32px (feature)
- Color: inherit text; active = `#ff3500`

---

## Voice & copy rules

- Direct, confident. Enthusiast-to-enthusiast.
- Title Case for nav and CTAs. Sentence case for body copy.
- Numbers always numeric: "16 GB DDR5", "850W 80+ Gold"
- CTAs imperative: "Add to Cart", "Shop Now", "Proceed to Checkout"
- No emoji in UI copy

---

## Light / dark mode

Both are supported from day one. The nav has a toggle. Semantic aliases
(`--bg`, `--surface`, `--text`, etc.) swap on theme change. Dark is the default
and primary experience.

---

## Claude Code skill

The design system is packaged as a Claude Code skill in
`gg-gaming-design-system/SKILL.md`. When invoked, it loads full brand context
into Claude's session — making it an expert in GG Gaming design for prototypes
or production code.

**Current location:** `gg-gaming-design-system/SKILL.md` (not yet on the
discovery path)

**To activate it**, move the directory to the correct path:

```bash
# Project scope (works for this repo only — recommended)
mkdir -p .claude/skills
mv gg-gaming-design-system .claude/skills/gg-gaming-design

# OR personal scope (works across all your projects)
mkdir -p ~/.claude/skills
cp -r gg-gaming-design-system ~/.claude/skills/gg-gaming-design
```

Once placed correctly, type `/gg-gaming-design` in any Claude Code session to
load the full design system as context.
