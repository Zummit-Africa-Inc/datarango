import type { Metadata } from "next";

import { fontVariables } from "@datarango/ui/fonts";

import { Providers } from "@/providers";

import "./globals.css";

export const metadata: Metadata = {
  title: {
    default: "Datarango — Learn data by running it",
    template: "%s · Datarango",
  },
  description:
    "Interactive courses, real Jupyter notebooks, datasets and live competitions — for individuals, teams and schools.",
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
