# GG Gaming Design System

## Company Overview

**GG Gaming** (`gaming.gg`) is a direct-to-consumer e-commerce storefront for gaming PC hardware — GPUs, CPUs, motherboards, memory, storage, peripherals (mice, keyboards, headsets), cases, cooling, and PSUs. The brand targets enthusiast buyers aged 18–35 who compare specs, read benchmarks, and care deeply about hardware brand pedigree.

The UI must communicate **quality and performance** without being overwhelming. It should feel at home in the gaming hardware space — sharp, fast, confident — while remaining professional enough to earn trust during high-consideration purchases.

### Source Materials
- `uploads/07-design-brief.md` — Full product brief: screens, user flows, tech stack, target users

### Tech Stack (design-relevant)
- **Framework:** Next.js 15, App Router, Server Components
- **Component library:** shadcn/ui (Radix primitives + Tailwind CSS)
- **Responsive:** Desktop-first, fully responsive. No native mobile app (web only).

---

## Products / Surfaces

| Surface | Path | Description |
|---|---|---|
| Storefront (web) | `ui_kits/storefront/` | The main customer-facing shopping experience |

---

## Content Fundamentals

### Voice & Tone
- **Direct and confident.** GG Gaming speaks like a knowledgeable friend at a LAN party — not a corporate marketer. No filler, no fluff.
- **Enthusiast-to-enthusiast.** Copy assumes the reader knows what VRAM means. Don't over-explain specs; surface them cleanly.
- **Punchy headlines.** Short, sharp, active. E.g. "Built to Win." "Max FPS, Zero Compromise." "Your Next Build Starts Here."
- **"You"-forward.** Talks to the user directly. "Your cart", "Your orders", "Build your rig."
- **No emoji in UI copy.** Emoji-free. Clean, fast, text-only UI labels.
- **Casing:** Title Case for navigation and CTAs. Sentence case for body copy, product descriptions, helper text.
- **Numbers:** Always show specs numerically — "16 GB DDR5", "RTX 4090", "850W 80+ Gold" — never spell out.
- **CTAs:** Imperative. "Add to Cart", "Shop Now", "Proceed to Checkout", "View Details".

### Example Copy Patterns
- Hero: *"The hardware you need. The speed you want."*
- CTA: *"Shop Now"*, *"Build Your Rig"*, *"Add to Cart"*
- Stock: *"In Stock"*, *"Low Stock"*, *"Out of Stock"*
- Error: *"Card declined. Please check your details and try again."*
- Empty state: *"Your cart is empty — browse categories to get started."*

---

## Visual Foundations

### Color System
The palette is built on a **dark navy-black** base with a vivid **orange-red primary** and cool gray neutrals. The contrast between the near-black surface and the hot accent creates the performance energy appropriate for the brand.

- **Primary accent:** `#ff3500` — Electric orange-red. Used for CTAs, highlights, active states, brand marks.
- **Backgrounds:** Three tiers — `#070a0e` (page bg), `#0d1117` (card/surface), `#141b24` (elevated surface / modal)
- **Borders:** `#1e2938` — Subtle cool-dark border
- **Foreground:** `#f0f4f8` (primary text), `#8a9bb0` (secondary/muted), `#4a5a6a` (disabled/placeholder)
- **Success:** `#16c77a` — Used for "In Stock", confirmations
- **Warning:** `#f5a623` — "Low Stock" badge
- **Danger/Destructive:** `#ef4444` — Errors, card declines, "Out of Stock"

### Typography
- **Display (hero headings):** Barlow Condensed — Bold, condensed uppercase. Used for hero headlines, banner text. Very large scale (64–120px).
- **Headings:** Barlow — Semi-condensed. Used for section titles, product names (24–40px).
- **Body:** DM Sans — Clean geometric sans. UI labels, descriptions, nav, buttons (14–18px).
- **Mono:** JetBrains Mono — Spec values, SKUs, order numbers, price decimals (12–14px).
- **Scale:** 12 / 14 / 16 / 18 / 24 / 32 / 40 / 56 / 72 / 96px

### Spacing
- **Base unit:** 4px. Scale: 4, 8, 12, 16, 24, 32, 48, 64, 96, 128px
- **Content max-width:** 1440px with 48px horizontal padding (desktop), 16px (mobile)
- **Grid:** 12-column with 24px gutters on desktop; single column on mobile

### Backgrounds & Surfaces
- Page background is near-black with a very subtle cool blue undertone — not pure black, not gray.
- Cards sit one level above with a thin `1px` border (`#1e2938`). No drop shadows by default on cards; separation is achieved through border and subtle background difference.
- Modal/drawer backgrounds use the elevated surface level.
- No gradients on backgrounds. No texture. No noise.
- Hero sections may use a **full-bleed dark image** with a protective dark-to-transparent overlay gradient on the left (for text legibility).

### Cards
- Background: `#0d1117` / Border: `1px solid #1e2938` / Border-radius: `8px`
- Product cards have a subtle hover state: border changes to `#ff3500` at 40% opacity, and the card lifts slightly (`translateY(-2px)`, `box-shadow: 0 8px 24px rgba(255,53,0,0.12)`)
- No inner shadows on cards.

### Borders & Radius
- **Global border radius:** `8px` for cards, containers; `6px` for inputs/buttons; `4px` for badges/chips; `2px` for dividers
- **No pill buttons** — rounded rectangle CTAs only
- Borders are always `1px solid #1e2938` (default) or `1px solid #ff3500` (active/focused)

### Shadows & Elevation
- **Level 0 (flat):** No shadow — cards at rest
- **Level 1 (hover):** `0 4px 12px rgba(0,0,0,0.4)` — card hover
- **Level 2 (float):** `0 8px 32px rgba(0,0,0,0.6)` — dropdowns, drawers
- **Level 3 (modal):** `0 16px 64px rgba(0,0,0,0.8)` — modals, overlays

### Animation & Motion
- **Easing:** `cubic-bezier(0.16, 1, 0.3, 1)` — fast out, punchy. Feels snappy and performance-oriented.
- **Duration:** 150ms for micro-interactions (hover, focus); 250ms for state changes; 350ms for panels/drawers
- **Hover states:** Color shift + subtle lift. No opacity fades on hover — always change color/border.
- **Press states:** Slight scale down `scale(0.97)` + darken. Fast: 80ms.
- **Page transitions:** None in MVP — instant navigation.
- **No bounces.** The brand is precise and mechanical, not playful.

### Imagery
- Product images: white or neutral background, clean studio shots. No lifestyle images on product cards.
- Hero imagery: Dark, atmospheric, hardware-focused. Cool or warm color graded. High contrast.
- No illustrations. No hand-drawn elements.
- Color grading: Slightly cool/blue-tinted product photography preferred for surface cohesion.

### Iconography
See ICONOGRAPHY section below.

### Hover / Focus / Active States
- **Links:** Color shifts to `#ff3500`. No underline.
- **Buttons (primary):** Background darkens 10% + subtle scale-down on press.
- **Inputs:** Border shifts from `#1e2938` to `#ff3500` on focus. No glow.
- **Nav items:** Left border accent `2px solid #ff3500` or bottom underline on active.
- **Product cards:** Border tints to accent, card lifts.

### Transparency & Blur
- Backdrop blur used sparingly: cart drawer backdrop (`blur(8px)` + `rgba(7,10,14,0.8)`)
- No frosted glass on main UI surfaces — reserved for overlays only.

---

## Iconography

GG Gaming uses **Lucide Icons** — a clean, consistent 24px stroke-based SVG icon set. Available via CDN: `https://unpkg.com/lucide@latest/dist/umd/lucide.min.js`

- **Style:** Stroke-only, 1.5px stroke weight, 24×24 viewBox. Minimal and precise — fits the clean dark UI.
- **Size usage:** 16px (inline/badge), 20px (button icons), 24px (nav, standalone), 32px (feature/callout icons)
- **Color:** Icons inherit text color. Active/accent icons use `#ff3500`.
- **No emoji** used as icons anywhere in the UI.
- **No PNG icon sprites** — all SVG via Lucide.
- **Key icons in use:** `shopping-cart`, `search`, `user`, `chevron-right`, `chevron-down`, `x`, `check`, `package`, `truck`, `credit-card`, `filter`, `sliders`, `star`, `trash-2`, `plus`, `minus`, `arrow-left`

### Logo
- Text-based wordmark: **"GG"** in Barlow Condensed Bold, tracking wide, followed by "GAMING" in DM Sans Medium.
- Primary: white on dark. Accent variant: `#ff3500` "GG" + white "GAMING".
- No icon/logomark yet defined — wordmark only for MVP.

---

## File Index

```
README.md                    ← This file
SKILL.md                     ← Agent skill definition
colors_and_type.css          ← CSS custom properties (colors + type)
assets/                      ← Logos, icons, brand assets
preview/                     ← Design system card previews (shown in DS tab)
ui_kits/
  storefront/                ← Full interactive storefront UI kit
    index.html               ← Main interactive prototype
    components/              ← Shared JSX components
```

---

## Design System Cards (preview/)

| Card | Group | Description |
|---|---|---|
| `preview/colors-base.html` | Colors | Background + surface palette |
| `preview/colors-accent.html` | Colors | Primary, semantic colors |
| `preview/colors-text.html` | Colors | Foreground / text scale |
| `preview/type-scale.html` | Type | Full type scale specimen |
| `preview/type-display.html` | Type | Display + heading styles |
| `preview/type-body.html` | Type | Body + mono styles |
| `preview/spacing.html` | Spacing | Spacing token scale |
| `preview/radius-shadow.html` | Spacing | Border radius + shadow levels |
| `preview/btn-primary.html` | Components | Primary & secondary buttons |
| `preview/badges.html` | Components | Stock badges + status labels |
| `preview/inputs.html` | Components | Form inputs |
| `preview/product-card.html` | Components | Product card states |
| `preview/logo.html` | Brand | Wordmark variants |
