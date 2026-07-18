import type { Metadata } from "next";

import { PricingFaq, PricingPlans } from "@/components/marketing/pricing";
import { PageIntro } from "@/components/marketing/page-intro";

export const metadata: Metadata = {
  title: "Pricing",
  description:
    "Free for individuals — pay only for the courses you take. Teams and schools pay per assigned course, postpaid.",
};

export default function PricingPage() {
  return (
    <main>
      <PageIntro
        eyebrow="Pricing"
        title={
          <>
            Pay for <span className="text-primary-500">learning</span>, not for seats
          </>
        }
        lede="No subscriptions. Individuals join free and pay per course — with money or with tokens they earned. Organizations pay only for courses they actually assign."
      />
      <PricingPlans />
      <PricingFaq />
    </main>
  );
}
