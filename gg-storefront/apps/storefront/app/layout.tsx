import type { Metadata } from "next";
import { Orbitron, Roboto, Roboto_Mono } from "next/font/google";
import "./globals.css";

const orbitron = Orbitron({
  subsets: ["latin"],
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
  title: {
    default: "GG Gaming — Gaming PC Hardware Store",
    template: "%s | GG Gaming",
  },
  description:
    "Shop gaming PC hardware at GG Gaming. GPUs, CPUs, motherboards, peripherals and more at gaming.gg.",
  metadataBase: new URL("https://gaming.gg"),
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" className="dark">
      <body
        className={`${orbitron.variable} ${roboto.variable} ${robotoMono.variable}`}
      >
        {children}
      </body>
    </html>
  );
}
