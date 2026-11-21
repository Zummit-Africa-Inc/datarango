import { Geist, Space_Grotesk, Space_Mono } from "next/font/google";

const display = Space_Grotesk({
  subsets: ["latin"],
  variable: "--font-space-grotesk",
  display: "swap",
});

const sans = Geist({
  subsets: ["latin"],
  variable: "--font-geist",
  display: "swap",
});

const mono = Space_Mono({
  subsets: ["latin"],
  weight: ["400", "700"],
  variable: "--font-space-mono",
  display: "swap",
});

/** Class names that expose the three font variables; put them on `<body>` (§2.6). */
export const fontVariables = [display.variable, sans.variable, mono.variable].join(" ");
