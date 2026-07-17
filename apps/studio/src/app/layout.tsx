import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "Datarango Studio",
  description: "Creator studio - courses, quizzes, notebook exercises, analytics.",
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en">
      <body>{children}</body>
    </html>
  );
}
