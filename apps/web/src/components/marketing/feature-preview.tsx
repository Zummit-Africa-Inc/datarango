"use client";

import type { LucideIcon } from "lucide-react";
import Link from "next/link";

import { Button, FadeIn, Stagger, StaggerItem } from "@datarango/ui";

import { PageIntro } from "./page-intro";

interface FeaturePoint {
  icon: LucideIcon;
  title: string;
  body: string;
}

interface Props {
  eyebrow: string;
  title: React.ReactNode;
  lede: string;
  points: FeaturePoint[];
  note?: string;
}

/**
 * Static preview page for platform surfaces that ship with the gateway
 * (courses, quizzes, competitions, datasets). Replaced by the live surface
 * in its build phase — keeps nav links working until then.
 */
export const FeaturePreview = ({ eyebrow, title, lede, points, note }: Props) => (
  <main>
    <PageIntro eyebrow={eyebrow} title={title} lede={lede} />
    <section className="container mx-auto px-4 pb-24 lg:px-8">
      <Stagger className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
        {points.map((point) => (
          <StaggerItem
            className="border-border bg-card hover:border-primary-300 rounded-2xl border p-8 transition-colors"
            key={point.title}
          >
            <point.icon className="text-primary-500 size-8" strokeWidth={1.5} />
            <h2 className="font-heading mt-5 text-xl">{point.title}</h2>
            <p className="text-muted-foreground mt-3 leading-relaxed">{point.body}</p>
          </StaggerItem>
        ))}
      </Stagger>
      <FadeIn className="border-border bg-card mx-auto mt-16 max-w-2xl rounded-3xl border p-10 text-center">
        <h2 className="font-heading text-2xl">
          Launching with the <span className="text-primary-500">platform</span>
        </h2>
        <p className="text-muted-foreground mx-auto mt-3 max-w-md leading-relaxed">
          {note ?? "This surface goes live with the Datarango platform. Join now and you'll be first in when it opens."}
        </p>
        <div className="mt-8 flex flex-wrap items-center justify-center gap-3">
          <Button asChild>
            <Link href="/signup">Join for free</Link>
          </Button>
          <Button asChild variant="outline">
            <Link href="/for-teams">For teams & schools</Link>
          </Button>
        </div>
      </FadeIn>
    </section>
  </main>
);
