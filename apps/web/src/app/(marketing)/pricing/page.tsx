import type { Metadata } from "next";

import { PricingFaq, PricingPlans } from "@/components/marketing/pricing";
import { PageIntro } from "@/components/marketing/page-intro";

export const metadata: Metadata = {
  title: "Pricing",
  description:
    "A free tier for individuals, then subscribe, buy a single course, or spend earned tokens. Teams and schools pay a flat monthly rate per seat.",
};

export default function PricingPage() {
  return (
    <main>
      <PageIntro
        eyebrow="Pricing"
        title={
          <>
            Start free. <span className="text-primary-500">Upgrade</span> however suits you
          </>
        }
        lede="Individuals get a free tier that never expires, then a choice: subscribe for everything, buy a single course, or redeem tokens you earned. Organizations pay a flat monthly rate per seat — every seated member gets the whole catalogue."
      />
      <PricingPlans />
      <PricingFaq />
    </main>
  );
}
