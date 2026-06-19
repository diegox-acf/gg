"use client";

import { useState } from "react";
import Link from "next/link";
import { Button, Input } from "@gg/ui";
import { Stepper } from "./stepper";
import { StripePaymentStep, type PendingOrder } from "./stripe-payment-step";
import { useCheckoutStep } from "@/lib/hooks/use-checkout-step";
import { useCart } from "@/components/cart/cart-provider";
import { placeOrder } from "@/lib/actions/checkout";
import { formatPrice } from "@/lib/mock-data";

const STEPS = ["Shipping", "Review", "Payment"];
const SHIPPING_CENTS = 999;
const TAX_RATE = 0.08;

type Shipping = {
  email: string;
  firstName: string;
  lastName: string;
  address1: string;
  address2: string;
  city: string;
  state: string;
  zip: string;
  country: string;
};

const EMPTY_SHIPPING: Shipping = {
  email: "",
  firstName: "",
  lastName: "",
  address1: "",
  address2: "",
  city: "",
  state: "",
  zip: "",
  country: "",
};

function SectionLabel({ children }: { children: React.ReactNode }) {
  return (
    <p className="mb-5 font-display text-[10px] font-semibold uppercase tracking-[0.15em] text-fg-3">
      {children}
    </p>
  );
}

export function CheckoutFlow() {
  const { items, subtotal } = useCart();
  const { current, goTo, next, back } = useCheckoutStep(STEPS.length);

  const [shipping, setShipping] = useState<Shipping>(EMPTY_SHIPPING);
  const [errors, setErrors] = useState<Record<string, string>>({});

  // The order is created (stock reserved + PaymentIntent) when the user enters the payment
  // step, so its client_secret is ready for Stripe Elements (ADR-021).
  const [pendingOrder, setPendingOrder] = useState<PendingOrder | null>(null);
  const [creating, setCreating] = useState(false);
  const [orderError, setOrderError] = useState<string | null>(null);

  const taxCents = Math.round(subtotal * TAX_RATE);
  const totalCents = subtotal + SHIPPING_CENTS + taxCents;

  function setShip(key: keyof Shipping, value: string) {
    setShipping((s) => ({ ...s, [key]: value }));
    setErrors((e) => ({ ...e, [key]: "" }));
  }

  function validateShipping(): boolean {
    const e: Record<string, string> = {};
    const required: (keyof Shipping)[] = [
      "email",
      "firstName",
      "lastName",
      "address1",
      "city",
      "state",
      "zip",
      "country",
    ];
    for (const k of required) if (!shipping[k].trim()) e[k] = "Required";
    if (shipping.email && !/^[^@\s]+@[^@\s]+\.[^@\s]+$/.test(shipping.email))
      e.email = "Enter a valid email";
    setErrors(e);
    return Object.keys(e).length === 0;
  }

  // Review → Payment: create the order + PaymentIntent, then advance once we have a client_secret.
  async function continueToPayment() {
    setCreating(true);
    setOrderError(null);
    const result = await placeOrder(shipping);
    setCreating(false);
    if (!result.ok) {
      setOrderError(result.error);
      return;
    }
    setPendingOrder(result);
    next();
  }

  // Leaving payment abandons the created order (its reservation is swept after TTL, D3); the next
  // forward pass creates a fresh one.
  function backFromPayment() {
    setPendingOrder(null);
    back();
  }

  // Empty-cart guard (skipped once an order has been created and we're on the payment step).
  if (items.length === 0 && !pendingOrder) {
    return (
      <div className="flex flex-col items-center gap-4 border border-dashed border-border bg-surface/40 px-6 py-20 text-center">
        <p className="font-display text-[15px] font-bold uppercase tracking-[0.08em] text-fg-1">
          Your cart is empty
        </p>
        <p className="font-body text-[13px] text-fg-2">
          Add some gear before checking out.
        </p>
        <Link href="/" className="mt-1">
          <Button>Browse Products</Button>
        </Link>
      </div>
    );
  }

  const shipTo = [
    shipping.address1,
    shipping.address2,
    `${shipping.city}, ${shipping.state} ${shipping.zip}`,
    shipping.country,
  ]
    .filter((s) => s && s.trim())
    .join(" · ");

  return (
    <div className="grid gap-7 lg:grid-cols-[1fr_320px]">
      {/* Main column */}
      <div>
        <Stepper.Root current={current} steps={STEPS} goTo={goTo}>
          <Stepper.Indicator />

          <div className="clip-cyber border border-border bg-surface p-6 sm:p-7">
            {/* Step 1 — Shipping */}
            <Stepper.Panel index={0}>
              <SectionLabel>Shipping Address</SectionLabel>
              <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                <Input
                  label="Email"
                  placeholder="you@example.com"
                  containerClassName="sm:col-span-2"
                  value={shipping.email}
                  error={errors.email}
                  onChange={(e) => setShip("email", e.target.value)}
                />
                <Input
                  label="First Name"
                  placeholder="John"
                  value={shipping.firstName}
                  error={errors.firstName}
                  onChange={(e) => setShip("firstName", e.target.value)}
                />
                <Input
                  label="Last Name"
                  placeholder="Doe"
                  value={shipping.lastName}
                  error={errors.lastName}
                  onChange={(e) => setShip("lastName", e.target.value)}
                />
                <Input
                  label="Address Line 1"
                  placeholder="123 Main St"
                  containerClassName="sm:col-span-2"
                  value={shipping.address1}
                  error={errors.address1}
                  onChange={(e) => setShip("address1", e.target.value)}
                />
                <Input
                  label="Address Line 2"
                  placeholder="Apt 4B (optional)"
                  containerClassName="sm:col-span-2"
                  value={shipping.address2}
                  onChange={(e) => setShip("address2", e.target.value)}
                />
                <Input
                  label="City"
                  placeholder="Austin"
                  value={shipping.city}
                  error={errors.city}
                  onChange={(e) => setShip("city", e.target.value)}
                />
                <Input
                  label="State"
                  placeholder="TX"
                  value={shipping.state}
                  error={errors.state}
                  onChange={(e) => setShip("state", e.target.value)}
                />
                <Input
                  label="ZIP Code"
                  placeholder="78701"
                  value={shipping.zip}
                  error={errors.zip}
                  onChange={(e) => setShip("zip", e.target.value)}
                />
                <Input
                  label="Country"
                  placeholder="United States"
                  value={shipping.country}
                  error={errors.country}
                  onChange={(e) => setShip("country", e.target.value)}
                />
              </div>
              <div className="mt-6">
                <Button
                  size="lg"
                  onClick={() => {
                    if (validateShipping()) next();
                  }}
                >
                  Continue to Review →
                </Button>
              </div>
            </Stepper.Panel>

            {/* Step 2 — Review */}
            <Stepper.Panel index={1}>
              <SectionLabel>Order Review</SectionLabel>
              <ul>
                {items.map((item) => (
                  <li
                    key={item.id}
                    className="flex items-center gap-4 border-b border-border py-3 last:border-b-0"
                  >
                    <div className="flex size-[52px] flex-shrink-0 items-center justify-center bg-elevated">
                      <span className="font-mono text-[8px] text-fg-3">
                        {item.sku}
                      </span>
                    </div>
                    <div className="flex-1">
                      <p className="font-body text-[13px] font-medium text-fg-1">
                        {item.name}
                      </p>
                      <p className="mt-0.5 font-body text-[12px] text-fg-3">
                        Qty: {item.qty}
                      </p>
                    </div>
                    <span className="font-display text-[14px] font-extrabold text-fg-1">
                      {formatPrice(item.priceCents * item.qty)}
                    </span>
                  </li>
                ))}
              </ul>

              <div className="mt-5 border border-border bg-elevated p-4">
                <p className="mb-1.5 font-display text-[9px] uppercase tracking-[0.15em] text-primary">
                  Ship To
                </p>
                <p className="font-body text-[13px] text-fg-2">{shipTo || "—"}</p>
              </div>

              {orderError && (
                <p
                  className="mt-4 border border-danger bg-danger-muted px-3 py-2 font-body text-[12px] text-danger"
                  role="alert"
                >
                  {orderError}
                </p>
              )}

              <div className="mt-6 flex gap-3">
                <Button variant="secondary" onClick={back} disabled={creating}>
                  ← Back
                </Button>
                <Button size="lg" loading={creating} onClick={continueToPayment}>
                  {creating ? "Reserving…" : "Continue to Payment →"}
                </Button>
              </div>
            </Stepper.Panel>

            {/* Step 3 — Payment (Stripe Elements) */}
            <Stepper.Panel index={2}>
              <SectionLabel>Payment</SectionLabel>
              {pendingOrder ? (
                <StripePaymentStep order={pendingOrder} onBack={backFromPayment} />
              ) : (
                <p className="font-body text-[13px] text-fg-2">Preparing payment…</p>
              )}
            </Stepper.Panel>
          </div>
        </Stepper.Root>
      </div>

      {/* Summary sidebar */}
      <aside className="clip-cyber h-fit border border-border bg-surface p-5 lg:sticky lg:top-[80px]">
        <SectionLabel>Order Summary</SectionLabel>
        <ul className="mb-3">
          {items.map((item) => (
            <li
              key={item.id}
              className="mb-2.5 flex justify-between gap-2 font-body text-[12px]"
            >
              <span className="text-fg-2">
                {item.name} <span className="text-fg-3">×{item.qty}</span>
              </span>
              <span className="whitespace-nowrap font-medium text-fg-1">
                {formatPrice(item.priceCents * item.qty)}
              </span>
            </li>
          ))}
        </ul>

        <div className="border-t border-border pt-3">
          {[
            ["Subtotal", subtotal],
            ["Shipping", SHIPPING_CENTS],
            ["Tax (8%)", taxCents],
          ].map(([label, value]) => (
            <div
              key={label}
              className="mb-2 flex justify-between font-body text-[12px] text-fg-2"
            >
              <span>{label}</span>
              <span className="text-fg-1">{formatPrice(value as number)}</span>
            </div>
          ))}
          <div className="mt-3 flex justify-between border-t border-border pt-3">
            <span className="font-display text-[15px] font-extrabold text-fg-1">
              Total
            </span>
            <span className="font-display text-[16px] font-black text-primary">
              {formatPrice(totalCents)}
            </span>
          </div>
        </div>
      </aside>
    </div>
  );
}
