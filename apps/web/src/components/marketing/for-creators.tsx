"use client";

import Image from "next/image";
import Link from "next/link";
import {
  BarChart3,
  Coins,
  FileVideo,
  Globe,
  NotebookPen,
  Send,
  Trophy,
  Upload,
  Wallet,
} from "lucide-react";

import { Button, FadeIn, Stagger, StaggerItem, TiltCard } from "@datarango/ui";
import { Gif } from "./gif";

/* ---------------------------------- hero ----------------------------------- */

const HERO_STATS = [
  { label: "Courses published", value: "150+" },
  { label: "Active learners", value: "12k+" },
  { label: "Avg. creator rating", value: "4.8★" },
];

export const CreatorsHero = () => (
  <section className="bg-ink text-white">
    <div className="container mx-auto grid items-center gap-16 px-4 py-24 lg:grid-cols-2 lg:px-8 lg:py-32">
      <FadeIn>
        <p className="text-primary-300 text-xs font-semibold tracking-widest uppercase">
          Datarango for Creators
        </p>
        <h1 className="font-heading text-on-ink mt-6 text-5xl leading-[1.02] tracking-tight lg:text-7xl">
          Teach data.
          <br />
          <span className="text-primary-400">Earn doing it.</span>
        </h1>
        <p className="mt-8 max-w-md text-lg leading-relaxed text-white/70">
          Publish courses, quizzes and notebook exercises on Datarango Studio. Set your own prices,
          reward learners with tokens, and reach thousands of data practitioners.
        </p>
        <div className="mt-10 flex flex-wrap gap-4">
          <Button
            asChild
            className="bg-primary-500 hover:bg-primary-400 h-12 px-8 text-base text-white"
          >
            <Link href="/contact">Apply to become a creator</Link>
          </Button>
        </div>
        <p className="mt-6 text-sm text-white/50">
          Creators are onboarded by invitation. Apply and we'll be in touch.
        </p>
      </FadeIn>
      <div className="relative hidden perspective-[1400px] lg:block" aria-hidden>
        <TiltCard
          className="rounded-xs border border-white/10 bg-white/5 p-6 backdrop-blur"
          rotateX={5}
          rotateY={-10}
          float
        >
          <div className="flex items-center justify-between">
            <p className="text-sm font-semibold">Your creator dashboard</p>
            <span className="rounded-full bg-white/10 px-2.5 py-1 text-xs">This month</span>
          </div>
          <div className="mt-6 grid grid-cols-3 gap-4">
            {HERO_STATS.map((stat) => (
              <div className="rounded-xs bg-white/5 p-4" key={stat.label}>
                <p className="text-xs text-white/50">{stat.label}</p>
                <p className="mono-data mt-1 text-2xl">{stat.value}</p>
              </div>
            ))}
          </div>
          <div className="mt-6 space-y-3">
            {[
              { title: "Intro to pandas", enrollments: 340, revenue: "₦68k" },
              { title: "SQL for Analysts", enrollments: 210, revenue: "₦42k" },
              { title: "ML with scikit-learn", enrollments: 95, revenue: "₦28.5k" },
            ].map((course) => (
              <div
                className="flex items-center justify-between rounded-xs bg-white/5 px-4 py-3"
                key={course.title}
              >
                <p className="text-sm">{course.title}</p>
                <div className="flex gap-x-4 text-xs text-white/60">
                  <span>{course.enrollments} enrolled</span>
                  <span className="text-primary-300">{course.revenue}</span>
                </div>
              </div>
            ))}
          </div>
        </TiltCard>
      </div>
    </div>
  </section>
);

/* -------------------------------- features --------------------------------- */

const CREATOR_FEATURES = [
  {
    icon: FileVideo,
    title: "Rich lesson formats",
    body: "Author lessons with video, text and audio. Mix formats freely within a single module.",
  },
  {
    icon: NotebookPen,
    title: "Live notebook exercises",
    body: "Attach CPU-backed Jupyter notebooks to any lesson. Learners run real code; you write the auto-grader.",
  },
  {
    icon: Coins,
    title: "Set token rewards",
    body: "Decide how many tokens each exercise awards. Learners redeem tokens for your courses — a built-in growth loop.",
  },
  {
    icon: Trophy,
    title: "Host competitions",
    body: "Create Kaggle-style competitions with your own datasets and scoring pipeline. Public or org-private.",
  },
  {
    icon: BarChart3,
    title: "Creator analytics",
    body: "Per-course enrollment, completion rates, exercise pass rates and revenue — all in one dashboard.",
  },
  {
    icon: Globe,
    title: "Reach a built-in audience",
    body: "Your courses are discoverable by 12k+ active learners the moment they pass review.",
  },
];

export const CreatorsFeatures = () => (
  <section className="container mx-auto px-4 py-24 lg:px-8 lg:py-32">
    <FadeIn className="mx-auto max-w-2xl text-center">
      <h2 className="font-heading text-4xl tracking-tight lg:text-6xl">
        Everything you need to <span className="text-primary-500">teach well</span>
      </h2>
      <p className="text-muted-foreground mt-6 text-lg">
        Datarango Studio gives you the tools to build courses that actually work — and the audience
        to make them worth building.
      </p>
    </FadeIn>
    <Stagger className="mt-16 grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
      {CREATOR_FEATURES.map((feature) => (
        <StaggerItem
          className="border-border bg-card hover:border-primary-300 rounded-xs border p-8 transition-colors"
          key={feature.title}
        >
          <feature.icon className="text-primary-500 size-8" strokeWidth={1.5} />
          <h3 className="font-heading mt-5 text-xl">{feature.title}</h3>
          <p className="text-muted-foreground mt-3 leading-relaxed">{feature.body}</p>
        </StaggerItem>
      ))}
    </Stagger>
  </section>
);

/* ---------------------------------- steps ---------------------------------- */

const STEPS = [
  {
    icon: Send,
    title: "Apply",
    body: "Tell us about your expertise and what you'd like to teach. We review every application personally.",
  },
  {
    icon: NotebookPen,
    title: "Get onboarded",
    body: "Once accepted, we walk you through Datarango Studio and set up your creator account.",
  },
  {
    icon: Upload,
    title: "Build & publish",
    body: "Author lessons, attach live notebooks, set prices and token rewards, then submit for final review.",
  },
  {
    icon: Wallet,
    title: "Get paid",
    body: "Earnings accumulate as learners enroll. Withdraw to your bank account on a monthly cycle.",
  },
];

export const CreatorsSteps = () => (
  <section className="border-border/60 border-y">
    <div className="container mx-auto px-4 py-24 lg:px-8">
      <FadeIn>
        <h2 className="font-heading text-3xl tracking-tight lg:text-5xl">How it works</h2>
      </FadeIn>
      <Stagger className="mt-14 grid gap-10 sm:grid-cols-2 lg:grid-cols-4">
        {STEPS.map((step, index) => (
          <StaggerItem key={step.title}>
            <div className="flex items-center gap-x-3">
              <span className="bg-primary-500 grid size-8 shrink-0 place-items-center rounded-full text-sm font-medium text-white">
                {index + 1}
              </span>
              <step.icon className="text-primary-500 size-6" strokeWidth={1.5} />
            </div>
            <h3 className="font-heading mt-4 text-lg">{step.title}</h3>
            <p className="text-muted-foreground mt-2 leading-relaxed">{step.body}</p>
          </StaggerItem>
        ))}
      </Stagger>
    </div>
  </section>
);

/* -------------------------------- earnings --------------------------------- */

const EARNINGS_POINTS = [
  {
    icon: Coins,
    title: "You set the price",
    body: "Price your course in naira. Learners can pay with money or tokens they earned on the platform.",
  },
  {
    icon: BarChart3,
    title: "Transparent revenue share",
    body: "A clear percentage of every enrollment goes to you. No hidden fees, no surprise deductions.",
  },
  {
    icon: Wallet,
    title: "Monthly payouts",
    body: "Earnings are settled monthly to your bank account. Your dashboard shows the running total in real time.",
  },
];

export const CreatorsEarnings = () => (
  <section className="container mx-auto grid items-center gap-16 px-4 py-24 lg:grid-cols-2 lg:px-8 lg:py-32">
    <FadeIn>
      <h2 className="font-heading text-4xl tracking-tight lg:text-6xl">
        Earn on your own <span className="text-primary-500">terms</span>
      </h2>
      <div className="mt-10 space-y-8">
        {EARNINGS_POINTS.map((point) => (
          <div className="flex items-start gap-x-4" key={point.title}>
            <point.icon className="text-primary-500 mt-1 size-6 shrink-0" strokeWidth={1.5} />
            <div>
              <h3 className="font-heading text-lg">{point.title}</h3>
              <p className="text-muted-foreground mt-1 leading-relaxed">{point.body}</p>
            </div>
          </div>
        ))}
      </div>
      <p className="text-muted-foreground border-border mt-10 rounded-xs border border-dashed p-4 text-sm">
        Token rewards you set for exercises come from the platform pool — they cost you nothing and
        incentivize learners to complete your course.
      </p>
    </FadeIn>
    <FadeIn className="relative hidden aspect-4/3 lg:block" delay={0.1}>
      <Gif title="creators" />
    </FadeIn>
  </section>
);

/* ----------------------------------- CTA ----------------------------------- */

export const CreatorsCta = () => (
  <section className="container mx-auto px-4 pb-24 lg:px-8 lg:pb-32">
    <FadeIn className="bg-ink rounded-xs px-8 py-20 text-center text-white lg:py-24">
      <h2 className="font-heading text-on-ink mx-auto max-w-3xl text-4xl tracking-tight lg:text-6xl">
        Your knowledge is worth <span className="text-primary-400">more than a blog post</span>
      </h2>
      <p className="mx-auto mt-6 max-w-xl text-lg text-white/70">
        Turn what you know into a course that earns while you sleep. Apply to join the Datarango
        creator program.
      </p>
      <div className="mt-10 flex flex-wrap items-center justify-center gap-4">
        <Button
          asChild
          className="bg-primary-500 hover:bg-primary-400 h-12 px-8 text-base text-white"
        >
          <Link href="/contact">Apply to become a creator</Link>
        </Button>
      </div>
    </FadeIn>
  </section>
);
