import type { Metadata } from "next";

import { fontVariables } from "@datarango/ui/fonts";
import "./globals.css";

import { Providers } from "@/providers";

export const metadata: Metadata = {
  title: {
    default: "Datarango Console",
    template: "%s · Datarango Console",
  },
  description: "Organization dashboard — members, assignments, progress, billing.",
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
