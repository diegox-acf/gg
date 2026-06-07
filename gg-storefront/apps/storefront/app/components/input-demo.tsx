"use client";

import { Input } from "@gg/ui";

export function InputDemo() {
  return (
    <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
      <Input placeholder="Search products…" />
      <Input label="Email address" placeholder="you@example.com" />
      <Input
        label="Card number"
        placeholder="1234 5678 9012 3456"
        error="This card number is invalid."
      />
      <Input
        label="Promo code"
        placeholder="SUMMER25"
        hint="Enter a valid promo code to apply a discount."
      />
      <Input label="Disabled field" value="RTX 4090" disabled readOnly />
    </div>
  );
}
