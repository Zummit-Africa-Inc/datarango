"use client";

import {
  BarChart3,
  BookOpen,
  Building2,
  Coins,
  FileSpreadsheet,
  Lock,
  Receipt,
  Shield,
  Trophy,
  Users,
} from "lucide-react";
import Image from "next/image";
import Link from "next/link";

import { Button, FadeIn, Stagger, StaggerItem, TiltCard } from "@datarango/ui";

/* ---------------------------------- hero ----------------------------------- */

const HERO_PROGRESS = [
  { label: "Data Analysis Fundamentals", value: 82 },
  { label: "Machine Learning Basics", value: 64 },
  { label: "SQL for Analysts", value: 91 },
];

export const TeamsHero = () => (
  <section className="bg-ink text-white">
    <div className="container mx-auto grid items-center gap-16 px-4 py-24 lg:grid-cols-2 lg:px-8 lg:py-32">
      <FadeIn>
        <p className="text-primary-300 text-xs font-semibold tracking-widest uppercase">
          Datarango for Teams & Schools
        </p>
        <h1 className="font-heading mt-6 text-5xl leading-[1.02] text-on-ink tracking-tight lg:text-7xl">
          Train a team like
          <br />
          you <span className="text-primary-400">mean it</span>
        </h1>
        <p className="mt-8 max-w-md text-lg leading-relaxed text-white/70">
          One console to onboard your organization, assign real coursework, and watch measurable
          progress — while your people keep everything they earn, even if they move on.
        </p>
        <div className="mt-10 flex flex-wrap gap-4">
          <Button
            asChild
            className="bg-primary-500 hover:bg-primary-400 h-12 px-8 text-base text-white"
          >
            <Link href="/signup?intent=org">Create an organization</Link>
          </Button>
          <Button
            asChild
            className="h-12 border-white/30 bg-transparent px-8 text-base text-white hover:bg-white/10"
            variant="outline"
          >
            <Link href="/contact">Book a demo</Link>
          </Button>
        </div>
        <p className="mt-6 text-sm text-white/50">
          Postpaid — no upfront commitment. Pay per assigned course at cycle end.
        </p>
      </FadeIn>
      <div className="relative hidden perspective-[1400px] lg:block" aria-hidden>
        <TiltCard
          className="rounded-3xl border border-white/10 bg-white/5 p-6 backdrop-blur"
          rotateX={5}
          rotateY={-10}
          float
        >
          <div className="flex items-center justify-between">
            <p className="text-sm font-semibold">Acme Academy — This cycle</p>
            <span className="rounded-full bg-white/10 px-2.5 py-1 text-xs">96 active learners</span>
          </div>
          <div className="mt-6 grid grid-cols-3 gap-4">
            {[
              { label: "Seats", value: "120" },
              { label: "Avg. completion", value: "64%" },
              { label: "Usage to date", value: "₦412k" },
            ].map((stat) => (
              <div className="rounded-xl bg-white/5 p-4" key={stat.label}>
                <p className="text-xs text-white/50">{stat.label}</p>
                <p className="mono-data mt-1 text-2xl">{stat.value}</p>
              </div>
            ))}
          </div>
          <div className="mt-6 space-y-4">
            {HERO_PROGRESS.map((course) => (
              <div key={course.label}>
                <div className="flex justify-between text-xs text-white/60">
                  <span>{course.label}</span>
                  <span>{course.value}%</span>
                </div>
                <div className="mt-1.5 h-2 rounded-full bg-white/10">
                  <div
                    className="bg-primary-400 h-2 rounded-full"
                    style={{ width: `${course.value}%` }}
                  />
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

const ORG_FEATURES = [
  {
    icon: Users,
    title: "Invites at any scale",
    body: "Invite one manager or a whole cohort by CSV. Members join with the roles you chose.",
  },
  {
    icon: Shield,
    title: "Roles built from permissions",
    body: "Owner, admin, manager, instructor, member — or compose custom roles from the permission catalog.",
  },
  {
    icon: BookOpen,
    title: "Course assignments",
    body: "Assign courses to members or groups. End-of-module exercises gate completion, so progress means something.",
  },
  {
    icon: BarChart3,
    title: "Progress you can defend",
    body: "Per-member, per-course drill-downs and CSV exports — certificates only count work done in your program.",
  },
  {
    icon: Trophy,
    title: "Private competitions",
    body: "Run org-only competitions on your own datasets, scored on the same pipeline as public ones.",
  },
  {
    icon: Lock,
    title: "Org SSO & MFA policy",
    body: "Bring your identity provider (Entra ID, Google Workspace), auto-provision members, enforce MFA.",
  },
];

export const TeamsFeatures = () => (
  <section className="container mx-auto px-4 py-24 lg:px-8 lg:py-32">
    <FadeIn className="mx-auto max-w-2xl text-center">
      <h2 className="font-heading text-4xl tracking-tight lg:text-6xl">
        Built for how <span className="text-primary-500">organizations</span> learn
      </h2>
      <p className="text-muted-foreground mt-6 text-lg">
        Everything in the learner platform, plus the control surface your L&D or faculty team needs.
      </p>
    </FadeIn>
    <Stagger className="mt-16 grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
      {ORG_FEATURES.map((feature) => (
        <StaggerItem
          className="border-border bg-card hover:border-primary-300 rounded-2xl border p-8 transition-colors"
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
    icon: Building2,
    title: "Create your organization",
    body: "Set up your org, connect SSO if you have it, and configure roles and policies.",
  },
  {
    icon: FileSpreadsheet,
    title: "Invite your people",
    body: "Single invites or a CSV of hundreds — members land in the right role automatically.",
  },
  {
    icon: BookOpen,
    title: "Assign courses",
    body: "Pick courses, assign to members or groups. Enrollment is instant; the meter starts here.",
  },
  {
    icon: BarChart3,
    title: "Track & report",
    body: "Watch completion climb, grade submissions, export reports your leadership will actually read.",
  },
];

export const TeamsSteps = () => (
  <section className="border-border/60 border-y">
    <div className="container mx-auto px-4 py-24 lg:px-8">
      <FadeIn>
        <h2 className="font-heading text-3xl tracking-tight lg:text-5xl">
          Live in an afternoon
        </h2>
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

/* --------------------------------- billing --------------------------------- */

const BILLING_POINTS = [
  {
    icon: Coins,
    title: "Pay per assigned course",
    body: "A billable unit is one member actively assigned one course in a cycle. Nothing else.",
  },
  {
    icon: BarChart3,
    title: "A meter, not a surprise",
    body: "The console shows the running total all cycle long — the invoice mirrors it line for line.",
  },
  {
    icon: Receipt,
    title: "Invoiced at cycle end",
    body: "Monthly by default, configurable per org. Pay by card or bank transfer.",
  },
];

export const TeamsBilling = () => (
  <section className="container mx-auto grid items-center gap-16 px-4 py-24 lg:grid-cols-2 lg:px-8 lg:py-32">
    <FadeIn>
      <h2 className="font-heading text-4xl tracking-tight lg:text-6xl">
        Billing that <span className="text-primary-500">respects</span> your budget
      </h2>
      <div className="mt-10 space-y-8">
        {BILLING_POINTS.map((point) => (
          <div className="flex items-start gap-x-4" key={point.title}>
            <point.icon className="text-primary-500 mt-1 size-6 shrink-0" strokeWidth={1.5} />
            <div>
              <h3 className="font-heading text-lg">{point.title}</h3>
              <p className="text-muted-foreground mt-1 leading-relaxed">{point.body}</p>
            </div>
          </div>
        ))}
      </div>
      <p className="text-muted-foreground border-border mt-10 rounded-xl border border-dashed p-4 text-sm">
        If your organization ever stops paying, your members keep access to every course already
        granted to them. Their learning is theirs.
      </p>
    </FadeIn>
    <FadeIn className="relative hidden aspect-4/3 overflow-hidden rounded-3xl lg:block" delay={0.1}>
      <Image
        alt="A team learning together"
        className="object-cover"
        fill
        sizes="(min-width: 1024px) 50vw, 100vw"
        src="/assets/images/for-business.jpg"
      />
    </FadeIn>
  </section>
);

/* ----------------------------------- CTA ------------------------------------ */

export const TeamsCta = () => (
  <section className="container mx-auto px-4 pb-24 lg:px-8 lg:pb-32">
    <FadeIn className="bg-ink rounded-3xl px-8 py-20 text-center text-white lg:py-24">
      <h2 className="font-heading mx-auto max-w-3xl text-4xl text-on-ink tracking-tight lg:text-6xl">
        Put your whole team on the <span className="text-primary-400">same curve</span>
      </h2>
      <p className="mx-auto mt-6 max-w-xl text-lg text-white/70">
        Create your organization now, or talk to us about rolling Datarango out across your school
        or company.
      </p>
      <div className="mt-10 flex flex-wrap items-center justify-center gap-4">
        <Button
          asChild
          className="bg-primary-500 hover:bg-primary-400 h-12 px-8 text-base text-white"
        >
          <Link href="/signup?intent=org">Create an organization</Link>
        </Button>
        <Button
          asChild
          className="h-12 border-white/30 bg-transparent px-8 text-base text-white hover:bg-white/10"
          variant="outline"
        >
          <Link href="/contact">Book a demo</Link>
        </Button>
      </div>
    </FadeIn>
  </section>
);
