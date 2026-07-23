import type { Metadata } from "next";
import { Allura, Cormorant_Garamond, Manrope, Patrick_Hand } from "next/font/google";
import "./globals.css";

const manrope = Manrope({
  variable: "--font-interface",
  subsets: ["latin"],
  display: "swap",
});

const cormorantGaramond = Cormorant_Garamond({
  variable: "--font-brand",
  subsets: ["latin"],
  display: "swap",
});

const patrickHand = Patrick_Hand({
  variable: "--font-handwritten",
  subsets: ["latin"],
  weight: "400",
  display: "swap",
});

const allura = Allura({
  variable: "--font-decorative",
  subsets: ["latin"],
  weight: "400",
  display: "swap",
});

export const metadata: Metadata = {
  title: "Our Family Headquarters",
  description: "A warm, shared home for family life.",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html
      lang="en"
      className={`${manrope.variable} ${cormorantGaramond.variable} ${patrickHand.variable} ${allura.variable}`}
    >
      <body>{children}</body>
    </html>
  );
}
