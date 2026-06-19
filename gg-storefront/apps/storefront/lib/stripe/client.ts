import { loadStripe, type Stripe } from "@stripe/stripe-js";
import type { Appearance } from "@stripe/stripe-js";

// Browser-side Stripe.js singleton. loadStripe is memoized to one promise so Elements
// isn't re-initialized on re-render. The publishable key is public by design (NEXT_PUBLIC_).
const KEY = process.env.NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY;

let stripePromise: Promise<Stripe | null> | null = null;

export function getStripe(): Promise<Stripe | null> {
  if (!KEY) {
    // Misconfiguration — surfaced in the UI as a disabled payment step rather than a crash.
    return Promise.resolve(null);
  }
  stripePromise ??= loadStripe(KEY);
  return stripePromise;
}

// Elements appearance mapped to the GG design tokens (globals.css) so the card form
// matches the brand: dark surfaces, lime accent, square (cyber) corners.
export const stripeAppearance: Appearance = {
  theme: "night",
  variables: {
    colorPrimary: "#d4ff00",
    colorBackground: "#141b24", // --color-elevated
    colorText: "#f0f4f8", // --color-fg-1
    colorTextSecondary: "#8a9bb0", // --color-fg-2
    colorDanger: "#ef4444", // --color-danger
    borderRadius: "0px", // brand uses hard/cyber edges
    fontFamily: "Roboto, system-ui, sans-serif",
    fontSizeBase: "14px",
  },
  rules: {
    ".Input": { border: "1px solid #1e2938", backgroundColor: "#0d1117" },
    ".Input:focus": { border: "1px solid #d4ff00", boxShadow: "none" },
    ".Label": { color: "#8a9bb0", fontSize: "12px" },
  },
};
