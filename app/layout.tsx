import type { Metadata, Viewport } from "next";
import { Allura, Cormorant_Garamond, Manrope, Patrick_Hand } from "next/font/google";
import PwaClient from "@/components/pwa/PwaClient";
import "./globals.css";

const manrope = Manrope({ variable: "--font-interface", subsets: ["latin"], display: "swap" });
const cormorantGaramond = Cormorant_Garamond({ variable: "--font-brand", subsets: ["latin"], display: "swap" });
const patrickHand = Patrick_Hand({ variable: "--font-handwritten", subsets: ["latin"], weight: "400", display: "swap" });
const allura = Allura({ variable: "--font-decorative", subsets: ["latin"], weight: "400", display: "swap" });

export const metadata: Metadata = {
  applicationName: "Our Family Headquarters",
  title: { default: "Our Family Headquarters", template: "%s · Our Family Headquarters" },
  description: "A warm, shared home for family life.",
  manifest: "/manifest.webmanifest",
  icons: {
    icon: [{ url: "/icons/icon-32.png", sizes: "32x32", type: "image/png" }, { url: "/icons/icon-192.png", sizes: "192x192", type: "image/png" }],
    apple: [{ url: "/icons/icon-180.png", sizes: "180x180", type: "image/png" }],
    other: [{ rel: "mask-icon", url: "/icons/safari-pinned-tab.svg", color: "#626B58" }],
  },
  appleWebApp: { capable: true, title: "Family HQ", statusBarStyle: "default", startupImage: "/icons/splash-2048.png" },
  formatDetection: { telephone: false },
};

export const viewport: Viewport = {
  themeColor: "#626B58",
  colorScheme: "light",
  viewportFit: "cover",
};

export default function RootLayout({ children }: Readonly<{ children: React.ReactNode }>) {
  return (
    <html lang="en" className={`${manrope.variable} ${cormorantGaramond.variable} ${patrickHand.variable} ${allura.variable}`}>
      <body><PwaClient />{children}</body>
    </html>
  );
}
