import type { Metadata } from "next";

import { PageHero } from "@/components/marketing/page-hero";
import { PricingFaq, PricingPlans } from "@/components/marketing/pricing";
import { PHOTOS } from "@/content/marketing";

export const metadata: Metadata = {
  title: "Pricing",
  description:
    "A free tier for individuals, then subscribe, buy a single course, or spend earned tokens. Teams and schools pay a flat monthly rate per seat.",
};

export default function PricingPage() {
  return (
    <main>
      <PageHero
        accent="lime"
        eyebrow="Pricing"
        lede="A free tier that never expires, then your choice: subscribe for everything, buy a single course, or spend tokens you earned. Organisations pay a flat monthly rate per seat, and every seated member gets the whole catalogue."
        photo={PHOTOS.graduate}
        title="Start free. Upgrade however suits you"
      />
      <PricingPlans />
      <PricingFaq />
    </main>
  );
}
