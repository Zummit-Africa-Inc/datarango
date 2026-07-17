import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "Datarango Console",
  description: "Organization dashboard - members, assignments, progress, billing.",
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en">
      <body>{children}</body>
    </html>
  );
}
