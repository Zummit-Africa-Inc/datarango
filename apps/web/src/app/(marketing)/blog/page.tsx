import { Rss } from "lucide-react";
import type { Metadata } from "next";

import { Button, FadeIn } from "@datarango/ui";

import { PageIntro } from "@/components/marketing/page-intro";

export const metadata: Metadata = {
  title: "Blog",
  description: "Writing on data, AI, and learning by doing — from the Datarango team.",
};

export default function BlogPage() {
  return (
    <main>
      <PageIntro
        eyebrow="Blog"
        title={
          <>
            Notes from the <span className="text-primary-500">workbench</span>
          </>
        }
        lede="Deep dives on data and AI skills, competition write-ups, and how we build Datarango itself."
      />

      <section className="container mx-auto px-4 pb-24 lg:px-8">
        <FadeIn className="border-border bg-card mx-auto max-w-2xl rounded-3xl border p-12 text-center">
          <Rss className="text-primary-500 mx-auto size-10" strokeWidth={1.5} />
          <h2 className="font-heading mt-6 text-2xl">First posts landing soon</h2>
          <p className="text-muted-foreground mx-auto mt-3 max-w-md leading-relaxed">
            We're writing the first batch now. Join the platform and you'll hear about new posts in
            your notification inbox.
          </p>
          <Button asChild className="mt-8">
            <a href="/signup">Join Datarango</a>
          </Button>
        </FadeIn>
      </section>
    </main>
  );
}
