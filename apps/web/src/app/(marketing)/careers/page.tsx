import { BriefcaseBusiness } from "lucide-react";
import type { Metadata } from "next";

import { Button, FadeIn } from "@datarango/ui";

import { PageIntro } from "@/components/marketing/page-intro";

export const metadata: Metadata = {
  title: "Careers",
  description: "Help us build the place where Africa learns data and AI by doing.",
};

export default function CareersPage() {
  return (
    <main>
      <PageIntro
        eyebrow="Careers"
        title={
          <>
            Build the place where people <span className="text-primary-500">learn by doing</span>
          </>
        }
        lede="We're a small team shipping a big surface — learning, notebooks, competitions, payments. If that sounds like your kind of problem, we want to hear from you even before a role is posted."
      />

      <section className="container mx-auto px-4 pb-24 lg:px-8">
        <FadeIn className="border-border bg-card mx-auto max-w-2xl rounded-3xl border p-12 text-center">
          <BriefcaseBusiness className="text-primary-500 mx-auto size-10" strokeWidth={1.5} />
          <h2 className="font-heading mt-6 text-2xl">No open roles right now</h2>
          <p className="text-muted-foreground mx-auto mt-3 max-w-md leading-relaxed">
            We hire ahead of need for exceptional people. Send us your CV and a note about what
            you'd want to own — engineering, content, or growth.
          </p>
          <Button asChild className="mt-8">
            <a href="mailto:careers@datarango.com?subject=Open%20application">
              careers@datarango.com
            </a>
          </Button>
        </FadeIn>
      </section>
    </main>
  );
}
