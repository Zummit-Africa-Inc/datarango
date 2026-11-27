import { Building2, LifeBuoy, Mail } from "lucide-react";
import type { Metadata } from "next";

import { Button, Stagger, StaggerItem } from "@datarango/ui";

import { PageHero } from "@/components/marketing/page-hero";
import { PHOTOS } from "@/content/marketing";

export const metadata: Metadata = {
  title: "Contact",
  description: "Talk to the Datarango team: sales, demos, support, or anything else.",
};

const CHANNELS = [
  {
    icon: Building2,
    title: "Teams and schools",
    body: "Rolling Datarango out across an organization? Book a demo and we'll walk you through the console, billing and onboarding.",
    action: { label: "Book a demo", href: "mailto:sales@datarango.com?subject=Demo%20request" },
  },
  {
    icon: LifeBuoy,
    title: "Support",
    body: "Stuck on anything: an account, a course, a notebook session? We aim to respond within one business day.",
    action: { label: "support@datarango.com", href: "mailto:support@datarango.com" },
  },
  {
    icon: Mail,
    title: "Everything else",
    body: "Partnerships, press, teaching on Datarango, or just saying hello. We read everything.",
    action: { label: "hello@datarango.com", href: "mailto:hello@datarango.com" },
  },
];

export default function ContactPage() {
  return (
    <main>
      <PageHero
        accent="sky"
        eyebrow="Contact"
        lede="Sales, support, partnerships or press: pick a lane below and a real person gets back to you, usually within one business day."
        photo={PHOTOS.laptop}
        title="Talk to a human"
      />

      <section className="container mx-auto px-4 pb-24 lg:px-8">
        <Stagger className="grid gap-4 lg:grid-cols-3">
          {CHANNELS.map((channel) => (
            <StaggerItem
              className="border-border bg-card flex flex-col rounded-2xl border p-7"
              key={channel.title}
            >
              <span className="bg-sky-tile text-sky-tile-foreground grid size-11 place-items-center rounded-xl">
                <channel.icon className="size-5" strokeWidth={1.75} />
              </span>
              <h2 className="font-display text-foreground mt-5 text-xl font-semibold">
                {channel.title}
              </h2>
              <p className="text-foreground-muted mt-3 flex-1 leading-relaxed">{channel.body}</p>
              <Button asChild className="mt-6 w-full" shape="pill" variant="secondary">
                <a href={channel.action.href}>{channel.action.label}</a>
              </Button>
            </StaggerItem>
          ))}
        </Stagger>
      </section>
    </main>
  );
}
