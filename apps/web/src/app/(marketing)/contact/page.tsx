import { Building2, LifeBuoy, Mail } from "lucide-react";
import type { Metadata } from "next";

import { Button, Stagger, StaggerItem } from "@datarango/ui";

import { PageIntro } from "@/components/marketing/page-intro";

export const metadata: Metadata = {
  title: "Contact",
  description: "Talk to the Datarango team — sales, demos, support, or anything else.",
};

const CHANNELS = [
  {
    icon: Building2,
    title: "Teams & schools",
    body: "Rolling Datarango out across an organization? Book a demo and we'll walk you through the console, billing and onboarding.",
    action: { label: "Book a demo", href: "mailto:sales@datarango.com?subject=Demo%20request" },
  },
  {
    icon: LifeBuoy,
    title: "Support",
    body: "Stuck on anything — an account, a course, a notebook session? We aim to respond within one business day.",
    action: { label: "support@datarango.com", href: "mailto:support@datarango.com" },
  },
  {
    icon: Mail,
    title: "Everything else",
    body: "Partnerships, press, teaching on Datarango, or just saying hello — we read everything.",
    action: { label: "hello@datarango.com", href: "mailto:hello@datarango.com" },
  },
];

export default function ContactPage() {
  return (
    <main>
      <PageIntro
        eyebrow="Contact"
        title={
          <>
            Talk to a <span className="text-primary-500">human</span>
          </>
        }
        lede="Sales, support, partnerships or press — pick a lane and we'll get back to you quickly."
      />

      <section className="container mx-auto px-4 pb-24 lg:px-8">
        <Stagger className="grid gap-6 lg:grid-cols-3">
          {CHANNELS.map((channel) => (
            <StaggerItem
              className="border-border bg-card flex flex-col rounded-2xl border p-8"
              key={channel.title}
            >
              <channel.icon className="text-primary-500 size-8" strokeWidth={1.5} />
              <h2 className="font-heading mt-5 text-xl">{channel.title}</h2>
              <p className="text-muted-foreground mt-3 flex-1 leading-relaxed">{channel.body}</p>
              <Button asChild className="mt-6 w-full" variant="outline">
                <a href={channel.action.href}>{channel.action.label}</a>
              </Button>
            </StaggerItem>
          ))}
        </Stagger>
      </section>
    </main>
  );
}
