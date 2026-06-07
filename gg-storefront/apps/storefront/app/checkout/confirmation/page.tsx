import type { Metadata } from "next";
import { Nav } from "@/components/nav/nav";
import { OrderConfirmation } from "@/components/checkout/order-confirmation";

export const metadata: Metadata = {
  title: "Order Confirmed — GG Gaming",
};

export default function ConfirmationPage() {
  return (
    <>
      <Nav />
      <main className="mx-auto max-w-[1100px] px-4 sm:px-8 lg:px-12">
        <OrderConfirmation />
      </main>
    </>
  );
}
