import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "Datarango",
  description: "Learn data analytics, AI and ML - courses, notebooks, competitions.",
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en">
      <body>{children}</body>
    </html>
  );
}
