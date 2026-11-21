import type { Metadata } from "next";

import { DesignPreview } from "./design-preview";

export const metadata: Metadata = {
  title: "Design system",
  robots: { index: false, follow: false },
};

export default function DesignSystemPage() {
  return <DesignPreview />;
}
