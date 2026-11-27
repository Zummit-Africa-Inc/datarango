"use client";

import {
  BarChart3,
  Coins,
  Layers,
  NotebookPen,
  Receipt,
  Trophy,
  Users,
  Wallet,
  type LucideIcon,
} from "lucide-react";
import Link from "next/link";

import { Button, ButtonArrow, FadeIn, Stagger, StaggerItem } from "@datarango/ui";

import { PHOTOS } from "@/content/marketing";

import { JoinBand } from "./feature-preview";
import { PageHero } from "./page-hero";
import { Eyebrow, PhotoFrame } from "./photo";

/* ---------------------------------- hero ----------------------------------- */

export const CreatorsHero = () => (
  <PageHero
    accent="violet"
    actions={
      <Button asChild shape="pill" size="lg">
        <Link href="/contact">
          Apply to become a creator
          <ButtonArrow />
        </Link>
      </Button>
    }
    eyebrow="For creators"
    footnote="Creators join by invitation. Apply and we'll be in touch."
    lede="Publish courses, quizzes and notebook exercises on Datarango Studio. Set your own prices, reward learners with tokens, and teach people who learn by doing."
    overlay={
      <>
        <p className="text-sm font-semibold">Your course</p>
        <ul className="text-foreground-muted mt-3 space-y-2 text-sm">
          <li className="flex justify-between">
            <span>Status</span>
            <span className="text-foreground font-medium">Published</span>
          </li>
          <li className="flex justify-between">
            <span>Exercises</span>
            <span className="text-foreground font-medium">Auto-graded</span>
          </li>
          <li className="flex justify-between">
            <span>Price</span>
            <span className="text-foreground font-medium">You decide</span>
          </li>
        </ul>
      </>
    }
    photo={PHOTOS.professional}
    title="Teach data. Earn doing it."
  />
);

/* -------------------------------- features --------------------------------- */

const FEATURES: { icon: LucideIcon; title: string; body: string }[] = [
  {
    icon: Layers,
    title: "Rich lesson formats",
    body: "Author lessons with video, text and audio, and mix formats freely within a module.",
  },
  {
    icon: NotebookPen,
    title: "Live notebook exercises",
    body: "Attach Jupyter notebooks to any lesson. Learners run real code; you write the grader.",
  },
  {
    icon: Coins,
    title: "Set token rewards",
    body: "Decide how many tokens each exercise awards. Learners can spend tokens on your courses.",
  },
  {
    icon: Trophy,
    title: "Host competitions",
    body: "Create competitions on your own datasets with automated scoring. Public or org-private.",
  },
  {
    icon: BarChart3,
    title: "Creator analytics",
    body: "Enrolments, completion, exercise pass rates and revenue per course, in one dashboard.",
  },
  {
    icon: Users,
    title: "A ready audience",
    body: "Your courses are discoverable by every Datarango learner the moment they pass review.",
  },
];

export const CreatorsFeatures = () => (
  <section className="container mx-auto px-4 pb-20 lg:px-8 lg:pb-28">
    <Stagger className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
      {FEATURES.map((feature) => (
        <StaggerItem className="border-border bg-card rounded-2xl border p-6" key={feature.title}>
          <span className="bg-violet-tile text-violet-tile-foreground grid size-11 place-items-center rounded-xl">
            <feature.icon className="size-5" strokeWidth={1.75} />
          </span>
          <h3 className="font-display text-foreground mt-5 text-lg font-semibold">
            {feature.title}
          </h3>
          <p className="text-foreground-muted mt-2 text-sm leading-relaxed">{feature.body}</p>
        </StaggerItem>
      ))}
    </Stagger>
  </section>
);

/* ---------------------------------- steps ---------------------------------- */

const STEPS = [
  {
    title: "Apply",
    body: "Tell us about your expertise and what you'd like to teach. We review every application personally.",
  },
  {
    title: "Get onboarded",
    body: "Once accepted, we walk you through Datarango Studio and set up your creator account.",
  },
  {
    title: "Build and publish",
    body: "Author lessons, attach notebooks, set prices and token rewards, then submit for review.",
  },
  {
    title: "Get paid",
    body: "Earnings build up as learners enrol, and are paid out to your bank account monthly.",
  },
];

export const CreatorsSteps = () => (
  <section className="container mx-auto px-4 pb-24 lg:px-8 lg:pb-32">
    <FadeIn className="grid items-center gap-12 lg:grid-cols-2 lg:gap-20">
      <PhotoFrame accent="violet" photo={PHOTOS.coding} side="left" />
      <div>
        <Eyebrow accent="violet">How it works</Eyebrow>
        <h2 className="font-display text-foreground mt-5 text-3xl font-semibold tracking-tight lg:text-5xl">
          From idea to published course
        </h2>
        <ol className="mt-8 space-y-6">
          {STEPS.map((step, index) => (
            <li className="flex gap-4" key={step.title}>
              <span className="bg-violet-tile text-violet-tile-foreground grid size-9 shrink-0 place-items-center rounded-full font-mono text-sm font-semibold">
                {index + 1}
              </span>
              <div>
                <h3 className="font-display text-foreground font-semibold">{step.title}</h3>
                <p className="text-foreground-muted mt-1 leading-relaxed">{step.body}</p>
              </div>
            </li>
          ))}
        </ol>
      </div>
    </FadeIn>
  </section>
);

/* -------------------------------- earnings --------------------------------- */

const EARNINGS = [
  {
    icon: Coins,
    title: "You set the price",
    body: "Price your course in naira. Learners pay with money, or with tokens they earned on the platform.",
  },
  {
    icon: Receipt,
    title: "Transparent revenue share",
    body: "A clear percentage of every enrolment goes to you. No hidden fees.",
  },
  {
    icon: Wallet,
    title: "Monthly payouts",
    body: "Earnings settle monthly to your bank account, with a running total in your dashboard.",
  },
];

export const CreatorsEarnings = () => (
  <section className="bg-violet-soft text-violet-soft-foreground">
    <div className="container mx-auto px-4 py-20 lg:px-8 lg:py-28">
      <FadeIn className="mx-auto max-w-2xl text-center">
        <h2 className="font-display text-3xl font-semibold tracking-tight lg:text-5xl">
          Earn on your own terms
        </h2>
        <p className="mt-4 text-lg opacity-85">
          Token rewards you set for exercises come from the platform pool: they cost you nothing and
          encourage learners to finish your course.
        </p>
      </FadeIn>
      <Stagger className="mt-12 grid gap-4 lg:grid-cols-3">
        {EARNINGS.map((point) => (
          <StaggerItem className="bg-card text-foreground rounded-2xl p-6" key={point.title}>
            <point.icon className="size-6" strokeWidth={1.75} />
            <h3 className="font-display mt-4 text-lg font-semibold">{point.title}</h3>
            <p className="text-foreground-muted mt-2 text-sm leading-relaxed">{point.body}</p>
          </StaggerItem>
        ))}
      </Stagger>
    </div>
  </section>
);

/* ----------------------------------- cta ----------------------------------- */

export const CreatorsCta = () => (
  <div className="pt-20 lg:pt-28">
    <JoinBand
      body="Turn what you know into a course people finish. Apply to join the Datarango creator programme."
      primary={{ href: "/contact", label: "Apply to become a creator" }}
      secondary={{ href: "/pricing", label: "See how pricing works" }}
      title="Your knowledge is worth more than a blog post"
    />
  </div>
);
