import { DM_Mono, EB_Garamond, Inter, Space_Mono } from "next/font/google";
import type { Metadata } from "next";
import "./globals.css";

import { Providers } from "@/providers";

const ebGaramond = EB_Garamond({
  subsets: ["latin"],
  variable: "--font-ebgaramond",
});

const inter = Inter({
  subsets: ["latin"],
  variable: "--font-inter",
});

const dmMono = DM_Mono({
  subsets: ["latin"],
  weight: ["400", "500"],
  variable: "--font-dm-mono",
});

const spaceMono = Space_Mono({
  subsets: ["latin"],
  // Space Mono ships only these two weights.
  weight: ["400", "700"],
  variable: "--font-space-mono",
});

export const metadata: Metadata = {
  title: {
    default: "Datarango Admin",
    template: "%s · Datarango Admin",
  },
  description: "Platform operations.",
  robots: { index: false, follow: false },
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en" suppressHydrationWarning>
      <body
        className={`${ebGaramond.variable} ${inter.variable} ${dmMono.variable} ${spaceMono.variable}`}
      >
        <Providers>{children}</Providers>
      </body>
    </html>
  );
}
