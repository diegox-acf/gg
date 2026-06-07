import type { Metadata } from "next";
import { Orbitron, Roboto, Roboto_Mono } from "next/font/google";
import { ThemeProvider, THEME_INIT_SCRIPT } from "@/components/theme/theme-provider";
import { CartProvider } from "@/components/cart/cart-provider";
import { CartDrawer } from "@/components/cart/cart-drawer";
import { getCart } from "@/lib/cart/cart-repo";
import "./globals.css";

const orbitron = Orbitron({
  subsets: ["latin"],
  weight: ["400", "500", "600", "700", "800", "900"],
  variable: "--font-orbitron",
  display: "swap",
});

const roboto = Roboto({
  subsets: ["latin"],
  weight: ["400", "500", "700"],
  variable: "--font-roboto",
  display: "swap",
});

const robotoMono = Roboto_Mono({
  subsets: ["latin"],
  weight: ["400", "500", "600"],
  variable: "--font-roboto-mono",
  display: "swap",
});

export const metadata: Metadata = {
  title: "GG Gaming — Max FPS. Zero Compromise.",
  description:
    "Premium gaming hardware: GPUs, CPUs, peripherals and more. Built to win.",
};

export default async function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  // Seed the cart mirror from Redis (active user or guest cookie) on every load.
  const initialCart = await getCart();

  return (
    <html
      lang="en"
      className={`${orbitron.variable} ${roboto.variable} ${robotoMono.variable}`}
      suppressHydrationWarning
    >
      <head>
        {/* Apply persisted theme before first paint to avoid a flash of the wrong theme. */}
        <script dangerouslySetInnerHTML={{ __html: THEME_INIT_SCRIPT }} />
      </head>
      <body className="min-h-screen antialiased">
        <ThemeProvider>
          <CartProvider initialItems={initialCart}>
            {children}
            <CartDrawer />
          </CartProvider>
        </ThemeProvider>
      </body>
    </html>
  );
}
