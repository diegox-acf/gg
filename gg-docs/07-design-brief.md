# 07 — Design Brief

> Context document for Claude Design. Covers the product, the audience, every
> storefront screen, and the key user flows. Admin screens are out of scope for
> this brief and will be addressed separately.

---

## What we're building

An e-commerce storefront for gaming PC hardware — GPUs, CPUs, motherboards,
memory, storage, peripherals (mice, keyboards, headsets), cases, cooling, and
PSUs.

**Brand name:** GG Gaming
**Domain:** gaming.gg
**Display name (UI):** GG Gaming

The experience must feel at home in the gaming hardware space: enthusiast
buyers who compare specs, read benchmarks, and care about brand. The UI should
communicate quality and performance without being overwhelming.

---

## Target users

| User | Who they are | What they need from the UI |
|---|---|---|
| Guest / Shopper | Gaming enthusiast, 18–35, comfortable online shopping | Fast browsing, clear specs, frictionless cart and checkout |
| Returning customer | Has an account, buys regularly | Quick access to past orders, saved session cart |

---

## Tech context (relevant to design)

- **Framework:** Next.js 15 with App Router and Server Components
- **Component library:** shadcn/ui (Radix primitives + Tailwind CSS)
- **Responsive:** Desktop-first but fully responsive; mobile must work
- **No native mobile app** — web only for MVP

---

## Screens

### 1. Home page (`/`)

**Purpose:** Landing page. Converts a first-time visitor into a browser.

**Key elements:**
- Hero section — brand statement + primary CTA ("Shop Now" or featured drop)
- Featured products grid — curated selection of ~8 products
- Category navigation — quick links to GPU, CPU, Peripherals, etc.
- Promotional banner (e.g. flash sale, new arrivals)

---

### 2. Category listing page (`/category/[slug]`)

**Purpose:** Browse all products within a category (e.g. GPUs, Keyboards).

**Key elements:**
- Page heading with category name and product count
- Filter sidebar — price range, brand, key spec filters (e.g. VRAM for GPUs, switch type for keyboards)
- Sort controls — price, newest, relevance
- Product grid — card per product: image, name, brand, price, stock badge ("In Stock" / "Low Stock" / "Out of Stock"), "Add to Cart" button
- Pagination

---

### 3. Product detail page (`/product/[slug]`)

**Purpose:** Full product information. The primary conversion page.

**Key elements:**
- Image gallery — main image + thumbnails
- Product name, brand, SKU
- Price (large, prominent)
- Stock status
- Specs table — structured key/value pairs (varies by category: GPU shows VRAM, TDP, clock speed; keyboard shows switch, layout, connectivity)
- "Add to Cart" button + quantity selector
- Short description / marketing copy
- Breadcrumb navigation (Home → Category → Product)

---

### 4. Cart (`/cart` or slide-over drawer)

**Purpose:** Review items before checkout.

**Key elements:**
- Line items — product image, name, unit price, quantity stepper, remove button
- Line item subtotals
- Order summary panel — subtotal, shipping ($9.99 flat), tax (8%), total
- "Proceed to Checkout" CTA (disabled / redirects to login if unauthenticated)
- "Continue Shopping" link
- Empty state — prompt to browse categories

---

### 5. Login / Register

**Purpose:** Authentication gateway before checkout.

**Note:** The actual login UI is hosted by Keycloak or AWS Cognito (external
identity provider). The storefront only renders a redirect page / loading state
while the OIDC flow completes. Design should cover:
- Pre-redirect interstitial ("Redirecting to secure login…")
- Post-login callback loading state

---

### 6. Checkout (`/checkout`)

**Purpose:** Collect shipping address and confirm the order. Payment is handled
via Stripe's hosted elements embedded in the page.

**Steps (single page, step indicator):**

1. **Shipping address** — name, address line 1 & 2, city, state, ZIP, country (US only)
2. **Order review** — line items summary, address confirmation, totals
3. **Payment** — Stripe Payment Element (card, Apple/Google Pay)
4. **Place order** — single CTA button; loading state while saga runs

**Key elements:**
- Step progress indicator
- Editable order summary sidebar (persistent on desktop)
- Inline field validation
- Error state — declined card message, out-of-stock message
- Loading / processing state while the saga completes (can take a few seconds)

---

### 7. Order confirmation (`/order/[id]/confirmation`)

**Purpose:** Reassure the customer the order went through. End of the happy path.

**Key elements:**
- Success indicator (checkmark, positive color)
- Order number (human-friendly, e.g. `GMR-2026-00042`)
- Summary of items ordered
- Estimated delivery copy (static/placeholder in MVP)
- CTAs: "View Order" and "Continue Shopping"

---

### 8. Account — order history (`/account/orders`)

**Purpose:** List of all past orders for the logged-in user.

**Key elements:**
- Order list — order number, date, status badge, total, "View Details" link
- Status badges: PENDING, CONFIRMED, FAILED
- Empty state for new accounts
- Pagination

---

### 9. Account — order detail (`/account/orders/[id]`)

**Purpose:** Full detail of a single past order.

**Key elements:**
- Order metadata — number, date placed, status
- Line items with product images, names, quantities, prices
- Shipping address
- Payment summary — subtotal, shipping, tax, total
- Payment method summary (last 4 digits, card brand)
- Back to order history link

---

## User flows

### Flow 1 — Guest browses and adds to cart

```
Home
 └─► Category listing (e.g. GPUs)
       └─► Product detail
             └─► [Add to Cart]
                   └─► Cart (drawer or page)
                         └─► [Proceed to Checkout] → redirects to Login
```

### Flow 2 — Authenticated checkout (happy path)

```
Cart
 └─► [Proceed to Checkout]
       └─► Checkout — Shipping address
             └─► Checkout — Order review
                   └─► Checkout — Payment (Stripe)
                         └─► [Place Order] → processing state
                               └─► Order confirmation
                                     └─► Account / Order detail
```

### Flow 3 — Failed payment

```
Checkout — Payment
 └─► [Place Order] → processing state
       └─► Error state (card declined)
             └─► User corrects payment method
                   └─► [Retry] → processing state
                         └─► Order confirmation  (or fails again)
```

### Flow 4 — Returning customer checks order history

```
[Account menu]
 └─► Order history
       └─► Order detail
```

---

## Out of scope for this design pass

- Admin dashboard (Phase 5)
- Email templates
- Notifications / alerts UI
- Search results page (Phase 2 — OpenSearch)
- Product reviews and ratings
- Wishlist
