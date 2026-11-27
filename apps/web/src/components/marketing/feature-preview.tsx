import { Check, type LucideIcon } from "lucide-react";
import Link from "next/link";
import type { ReactNode } from "react";

import {
  ACCENT_CLASSES,
  Button,
  ButtonArrow,
  FadeIn,
  Stagger,
  StaggerItem,
  cn,
  type AccentToken,
} from "@datarango/ui";

import type { Photo } from "@/content/marketing";

import { PageHero } from "./page-hero";
import { Eyebrow, PhotoFrame } from "./photo";

interface FeaturePoint {
  icon: LucideIcon;
  title: string;
  body: string;
}

interface Story {
  eyebrow: string;
  title: string;
  body: string;
  bullets: string[];
  photo: Photo;
}

interface Props {
  eyebrow: string;
  title: string;
  lede: string;
  accent: AccentToken;
  photo: Photo;
  /** Product card laid over the hero photo. */
  overlay?: ReactNode;
  points: FeaturePoint[];
  story: Story;
  /** Where "see it in the app" goes once signed in. */
  appHref: string;
}

/** Closing call to action shared by the marketing subpages. */
export const JoinBand = ({
  title = "Start learning by doing, free",
  body = "Join free, open a course, and be running real code in minutes.",
  primary = { href: "/signup", label: "Join for free" },
  secondary = { href: "/for-teams", label: "For teams and schools" },
}: {
  title?: string;
  body?: string;
  primary?: { href: string; label: string };
  secondary?: { href: string; label: string };
}) => (
  <section className="container mx-auto px-4 pb-24 lg:px-8 lg:pb-32">
    <FadeIn className="bg-primary-soft text-primary-soft-foreground rounded-3xl px-8 py-14 text-center lg:py-20">
      <h2 className="font-display mx-auto max-w-2xl text-3xl font-semibold tracking-tight lg:text-5xl">
        {title}
      </h2>
      <p className="mx-auto mt-4 max-w-xl text-lg opacity-85">{body}</p>
      <div className="mt-8 flex flex-wrap items-center justify-center gap-3">
        <Button asChild shape="pill" size="lg">
          <Link href={primary.href}>
            {primary.label}
            <ButtonArrow />
          </Link>
        </Button>
        <Button asChild shape="pill" size="lg" variant="secondary">
          <Link href={secondary.href}>{secondary.label}</Link>
        </Button>
      </div>
    </FadeIn>
  </section>
);

/**
 * Marketing page for one product surface (courses, quizzes, datasets,
 * competitions): photo hero, feature tiles, a photo-led story row, and a
 * call to action.
 */
export const ProductPage = ({
  eyebrow,
  title,
  lede,
  accent,
  photo,
  overlay,
  points,
  story,
  appHref,
}: Props) => (
  <main>
    <PageHero
      accent={accent}
      actions={
        <>
          <Button asChild shape="pill" size="lg">
            <Link href="/signup">
              Start free
              <ButtonArrow />
            </Link>
          </Button>
          <Link
            className="text-foreground font-medium underline-offset-4 hover:underline"
            href={appHref}
          >
            Already a member? Open it
          </Link>
        </>
      }
      eyebrow={eyebrow}
      lede={lede}
      overlay={overlay}
      photo={photo}
      title={title}
    />

    <section className="container mx-auto px-4 pb-20 lg:px-8 lg:pb-28">
      <Stagger className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
        {points.map((point) => (
          <StaggerItem className="border-border bg-card rounded-2xl border p-6" key={point.title}>
            <span
              className={cn(
                "grid size-11 place-items-center rounded-xl",
                ACCENT_CLASSES[accent].tile,
              )}
            >
              <point.icon className="size-5" strokeWidth={1.75} />
            </span>
            <h2 className="font-display text-foreground mt-5 text-lg font-semibold">
              {point.title}
            </h2>
            <p className="text-foreground-muted mt-2 text-sm leading-relaxed">{point.body}</p>
          </StaggerItem>
        ))}
      </Stagger>
    </section>

    <section className="container mx-auto px-4 pb-24 lg:px-8 lg:pb-32">
      <FadeIn className="grid items-center gap-12 lg:grid-cols-2 lg:gap-20">
        <PhotoFrame accent={accent} photo={story.photo} side="left" />
        <div>
          <Eyebrow accent={accent}>{story.eyebrow}</Eyebrow>
          <h2 className="font-display text-foreground mt-5 text-3xl font-semibold tracking-tight lg:text-5xl">
            {story.title}
          </h2>
          <p className="text-foreground-muted mt-5 max-w-lg text-lg leading-relaxed">
            {story.body}
          </p>
          <ul className="mt-6 space-y-3">
            {story.bullets.map((bullet) => (
              <li className="text-foreground flex items-center gap-3" key={bullet}>
                <span
                  className={cn(
                    "grid size-6 shrink-0 place-items-center rounded-full",
                    ACCENT_CLASSES[accent].tile,
                  )}
                >
                  <Check className="size-3.5" strokeWidth={3} />
                </span>
                {bullet}
              </li>
            ))}
          </ul>
        </div>
      </FadeIn>
    </section>

    <JoinBand />
  </main>
);
