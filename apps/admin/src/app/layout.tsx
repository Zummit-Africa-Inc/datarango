import type { Metadata } from "next";

import { fontVariables } from "@datarango/ui/fonts";
import "./globals.css";

import { Providers } from "@/providers";

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
      <body className={fontVariables}>
        <Providers>{children}</Providers>
      </body>
    </html>
  );
}
