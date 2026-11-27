"use client";

import {
  BarChart3,
  BookOpen,
  Building2,
  Coins,
  KeyRound,
  Receipt,
  ShieldCheck,
  Trophy,
  UserPlus,
  Users,
  type LucideIcon,
} from "lucide-react";
import Link from "next/link";

import { Button, ButtonArrow, FadeIn, Stagger, StaggerItem } from "@datarango/ui";

import { PHOTOS } from "@/content/marketing";

import { JoinBand } from "./feature-preview";
import { PageHero } from "./page-hero";
import { Eyebrow, PhotoFrame } from "./photo";

/* ---------------------------------- hero ----------------------------------- */

const SAMPLE_PROGRESS = [
  { label: "Data analysis basics", value: 82 },
  { label: "Machine learning", value: 64 },
  { label: "SQL for analysts", value: 91 },
];

export const TeamsHero = () => (
  <PageHero
    accent="teal"
    actions={
      <>
        <Button asChild shape="pill" size="lg">
          <Link href="/signup?intent=org">
            Create an organisation
            <ButtonArrow />
          </Link>
        </Button>
        <Button asChild shape="pill" size="lg" variant="secondary">
          <Link href="/contact">Book a demo</Link>
        </Button>
      </>
    }
    eyebrow="For teams and schools"
    footnote="Flat rate per seat. Assigning more courses never changes the bill."
    lede="One console to onboard your organisation, assign real coursework and see measurable progress, while your people keep everything they earn, even if they move on."
    overlay={
      <>
        <p className="text-sm font-semibold">This cycle</p>
        <ul className="mt-3 space-y-3">
          {SAMPLE_PROGRESS.map((course) => (
            <li key={course.label}>
              <div className="text-foreground-muted flex justify-between text-xs">
                <span>{course.label}</span>
                <span className="font-mono">{course.value}%</span>
              </div>
              <div className="bg-muted mt-1 h-1.5 overflow-hidden rounded-full">
                <div
                  className="bg-primary h-full rounded-full"
                  style={{ width: `${course.value}%` }}
                />
              </div>
            </li>
          ))}
        </ul>
      </>
    }
    photo={PHOTOS.training}
    title="Train a team like you mean it"
  />
);

/* -------------------------------- features --------------------------------- */

const FEATURES: { icon: LucideIcon; title: string; body: string }[] = [
  {
    icon: UserPlus,
    title: "Invites at any scale",
    body: "Invite one manager or a whole cohort by CSV. Members join with the roles you chose.",
  },
  {
    icon: KeyRound,
    title: "Roles built from permissions",
    body: "Owner, admin, manager, instructor, member, or custom roles composed from the permission catalogue.",
  },
  {
    icon: BookOpen,
    title: "Course assignments",
    body: "Assign courses to members or groups. Graded exercises gate completion, so progress means something.",
  },
  {
    icon: BarChart3,
    title: "Progress you can defend",
    body: "Per-member, per-course drill-downs and CSV exports for the reports leadership reads.",
  },
  {
    icon: Trophy,
    title: "Private competitions",
    body: "Run organisation-only competitions on your own datasets, scored like the public ones.",
  },
  {
    icon: ShieldCheck,
    title: "Org SSO and MFA policy",
    body: "Bring your identity provider (Entra ID, Google Workspace), provision members, enforce MFA.",
  },
];

export const TeamsFeatures = () => (
  <section className="container mx-auto px-4 pb-20 lg:px-8 lg:pb-28">
    <Stagger className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
      {FEATURES.map((feature) => (
        <StaggerItem className="border-border bg-card rounded-2xl border p-6" key={feature.title}>
          <span className="bg-teal-tile text-teal-tile-foreground grid size-11 place-items-center rounded-xl">
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
    icon: Building2,
    title: "Create your organisation",
    body: "Set up your org, connect SSO if you have it, and configure roles and policies.",
  },
  {
    icon: Users,
    title: "Invite your people",
    body: "Single invites or a CSV of hundreds: members land in the right role.",
  },
  {
    icon: BookOpen,
    title: "Assign courses",
    body: "Assign to members or groups. Enrolment is instant, and assigning never changes your bill.",
  },
  {
    icon: BarChart3,
    title: "Track and report",
    body: "Watch completion climb, review submissions, export reports.",
  },
];

export const TeamsSteps = () => (
  <section className="container mx-auto px-4 pb-24 lg:px-8 lg:pb-32">
    <FadeIn className="grid items-center gap-12 lg:grid-cols-2 lg:gap-20">
      <PhotoFrame accent="teal" photo={PHOTOS.colleagues} side="left" />
      <div>
        <Eyebrow accent="teal">Getting started</Eyebrow>
        <h2 className="font-display text-foreground mt-5 text-3xl font-semibold tracking-tight lg:text-5xl">
          Live in an afternoon
        </h2>
        <ol className="mt-8 space-y-6">
          {STEPS.map((step, index) => (
            <li className="flex gap-4" key={step.title}>
              <span className="bg-teal-tile text-teal-tile-foreground grid size-9 shrink-0 place-items-center rounded-full font-mono text-sm font-semibold">
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

/* --------------------------------- billing --------------------------------- */

const BILLING = [
  {
    icon: Coins,
    title: "One rate, per seat",
    body: "A seat is one active member, with the whole catalogue. Assign as much as you like without touching the bill.",
  },
  {
    icon: Users,
    title: "Seats you can see",
    body: "The console shows licensed against used seats, so you know where you stand before renewal.",
  },
  {
    icon: Receipt,
    title: "Predictable each cycle",
    body: "Monthly by default. Mid-cycle joiners are prorated; leavers free their seat at once.",
  },
];

export const TeamsBilling = () => (
  <section className="bg-teal-soft text-teal-soft-foreground">
    <div className="container mx-auto px-4 py-20 lg:px-8 lg:py-28">
      <FadeIn className="mx-auto max-w-2xl text-center">
        <h2 className="font-display text-3xl font-semibold tracking-tight lg:text-5xl">
          Billing that respects your budget
        </h2>
      </FadeIn>
      <Stagger className="mt-12 grid gap-4 lg:grid-cols-3">
        {BILLING.map((point) => (
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

export const TeamsCta = () => (
  <div className="pt-20 lg:pt-28">
    <JoinBand
      body="Create your organisation now, or talk to us about rolling Datarango out across your school or company."
      primary={{ href: "/signup?intent=org", label: "Create an organisation" }}
      secondary={{ href: "/contact", label: "Book a demo" }}
      title="Put your whole team on the same curve"
    />
  </div>
);
