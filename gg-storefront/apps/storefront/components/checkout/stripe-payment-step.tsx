"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Lock } from "lucide-react";
import {
  Elements,
  PaymentElement,
  useElements,
  useStripe,
} from "@stripe/react-stripe-js";
import { Button } from "@gg/ui";
import { getStripe, stripeAppearance } from "@/lib/stripe/client";
import { useCart } from "@/components/cart/cart-provider";
import { useOrderStore } from "@/lib/order/order-store";
import { formatPrice } from "@/lib/mock-data";

const stripePromise = getStripe();

export type PendingOrder = {
  orderId: number;
  orderNumber: string;
  clientSecret: string;
  totalCents: number;
  itemCount: number;
  email: string;
};

/**
 * Payment step: mounts Stripe Elements against the PaymentIntent created by the saga and confirms
 * the card in the browser (ADR-021). On success the order is stashed for the confirmation page,
 * the cart is cleared, and we navigate; the webhook drives the order to CONFIRMED meanwhile.
 */
export function StripePaymentStep({
  order,
  onBack,
}: {
  order: PendingOrder;
  onBack: () => void;
}) {
  return (
    <Elements
      stripe={stripePromise}
      options={{ clientSecret: order.clientSecret, appearance: stripeAppearance }}
    >
      <PaymentForm order={order} onBack={onBack} />
    </Elements>
  );
}

function PaymentForm({ order, onBack }: { order: PendingOrder; onBack: () => void }) {
  const stripe = useStripe();
  const elements = useElements();
  const router = useRouter();
  const { clearCart } = useCart();
  const setLastOrder = useOrderStore((s) => s.setLastOrder);

  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function handlePay() {
    if (!stripe || !elements) return; // Stripe.js still loading
    setSubmitting(true);
    setError(null);

    // Confirm the card. redirect: "if_required" keeps card payments on-page (no return_url hop).
    const { error: confirmError } = await stripe.confirmPayment({
      elements,
      redirect: "if_required",
    });

    if (confirmError) {
      // Declined / validation — the order's webhook will mark it FAILED + release stock.
      setError(confirmError.message ?? "Your payment could not be processed.");
      setSubmitting(false);
      return;
    }

    // Payment accepted by Stripe. Record it for the confirmation page (which polls for the
    // terminal status), clear the cart, and go.
    setLastOrder({
      id: order.orderId,
      number: order.orderNumber,
      placedAt: new Date().toISOString(),
      itemCount: order.itemCount,
      totalCents: order.totalCents,
      email: order.email,
    });
    await clearCart();
    router.push("/checkout/confirmation");
  }

  return (
    <>
      <div className="clip-cyber-sm border border-border bg-elevated p-5">
        <p className="mb-4 flex items-center gap-2 font-display text-[9px] uppercase tracking-[0.15em] text-primary">
          <Lock size={11} /> Secure Payment · Test Mode
        </p>
        <PaymentElement options={{ layout: "tabs" }} />
        {error && (
          <p className="mt-4 font-body text-[12px] text-danger" role="alert">
            {error}
          </p>
        )}
      </div>

      <div className="mt-6 flex gap-3">
        <Button variant="secondary" onClick={onBack} disabled={submitting}>
          ← Back
        </Button>
        <Button
          size="lg"
          loading={submitting}
          disabled={!stripe || submitting}
          onClick={handlePay}
          className="flex-1"
        >
          {submitting ? "Processing…" : `Pay · ${formatPrice(order.totalCents)}`}
        </Button>
      </div>
    </>
  );
}
