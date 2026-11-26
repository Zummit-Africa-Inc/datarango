"use client";

import {
  BarChart3,
  BookOpen,
  Coins,
  Gauge,
  NotebookPen,
  Play,
  Quote,
  Trophy,
  Users,
  type LucideIcon,
} from "lucide-react";
import Image from "next/image";
import Link from "next/link";

import {
  ACCENT_CLASSES,
  Button,
  ButtonArrow,
  Circle,
  FadeIn,
  Ring,
  Stagger,
  StaggerItem,
  cn,
  type AccentToken,
} from "@datarango/ui";

import { CourseCard } from "@/components/learning/course-card";
import { INSTRUCTORS, TESTIMONIALS } from "@/content/marketing";
import type { Course } from "@/hooks/learning";

const SectionHeading = ({
  title,
  lede,
  align = "center",
  className,
}: {
  title: string;
  lede?: string;
  align?: "center" | "left";
  className?: string;
}) => (
  <div className={cn(align === "center" && "mx-auto max-w-2xl text-center", className)}>
    <h2 className="font-display text-foreground text-3xl font-semibold tracking-tight lg:text-5xl">
      {title}
    </h2>
    {lede && <p className="text-foreground-muted mt-4 text-lg">{lede}</p>}
  </div>
);

/* ------------------------------ why datarango ------------------------------ */

const WHY: { icon: LucideIcon; title: string; body: string; accent: AccentToken }[] = [
  {
    icon: NotebookPen,
    title: "Real notebooks",
    body: "Lessons open into a live Jupyter session with the dataset already mounted.",
    accent: "violet",
  },
  {
    icon: Gauge,
    title: "Graded, not watched",
    body: "Every module ends with an exercise you have to pass to move on.",
    accent: "amber",
  },
  {
    icon: Trophy,
    title: "Competitions",
    body: "Score your models on real datasets against everyone else's.",
    accent: "rose",
  },
  {
    icon: Coins,
    title: "Earn as you learn",
    body: "Quizzes, streaks and placings credit tokens you can spend on courses.",
    accent: "lime",
  },
];

/** "Why Datarango" as four colour tiles (§7.1, flat fills). */
export const WhyTiles = () => (
  <section className="container mx-auto px-4 py-20 lg:px-8 lg:py-28">
    <SectionHeading
      lede="Practice is the course. Everything else supports it."
      title="Why people learn here"
    />
    <Stagger className="mt-12 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
      {WHY.map((item) => (
        <StaggerItem
          className={cn(
            "relative overflow-hidden rounded-2xl p-6",
            ACCENT_CLASSES[item.accent].soft,
          )}
          key={item.title}
        >
          <Circle accent={item.accent} className="absolute -right-10 -bottom-10" size={120} />
          <span
            className={cn(
              "relative grid size-12 place-items-center rounded-xl",
              ACCENT_CLASSES[item.accent].tile,
            )}
          >
            <item.icon className="size-6" strokeWidth={1.75} />
          </span>
          <h3 className="font-display relative mt-6 text-xl font-semibold">{item.title}</h3>
          <p className="relative mt-2 text-sm leading-relaxed opacity-85">{item.body}</p>
        </StaggerItem>
      ))}
    </Stagger>
  </section>
);

/* ----------------------------- popular courses ----------------------------- */

/**
 * Real published courses from the public catalogue. Left out entirely when
 * the catalogue is empty or unreachable. Category chips wait on a category
 * field (contract-gaps.md).
 */
export const CourseShowcase = ({ courses, total }: { courses: Course[]; total: number }) => {
  if (courses.length === 0) return null;
  return (
    <section className="bg-background-subtle border-border border-y">
      <div className="container mx-auto px-4 py-20 lg:px-8 lg:py-28">
        <div className="flex flex-wrap items-end justify-between gap-4">
          <SectionHeading
            align="left"
            lede="Published courses, each with graded exercises."
            title="Start with a course"
          />
          <Button asChild shape="pill" variant="secondary">
            <Link href="/dashboard/courses">
              Browse all {total.toLocaleString()}
              <ButtonArrow />
            </Link>
          </Button>
        </div>
        <Stagger className="mt-10 grid gap-5 sm:grid-cols-2 lg:grid-cols-4">
          {courses.slice(0, 8).map((course) => (
            <StaggerItem key={course.id}>
              <CourseCard course={course} enrolled={false} />
            </StaggerItem>
          ))}
        </Stagger>
      </div>
    </section>
  );
};

/* ----------------------- notebooks + competitions band ---------------------- */

const CELL = [
  'df = pd.read_csv("churn.csv")',
  "model.fit(X_train, y_train)",
  "roc_auc_score(y_test, model.predict_proba(X_test)[:, 1])",
];

/** Dark band: a notebook cell and a leaderboard, drawn as product UI (§7.1). */
export const PracticeBand = () => (
  <section className="bg-band text-on-band">
    <div className="container mx-auto grid items-center gap-14 px-4 py-20 lg:grid-cols-2 lg:px-8 lg:py-28">
      <FadeIn>
        <h2 className="font-display text-on-band text-3xl font-semibold tracking-tight lg:text-5xl">
          Notebooks and competitions, built in
        </h2>
        <p className="text-on-band-muted mt-5 max-w-md text-lg leading-relaxed">
          Write real code against hosted datasets, then submit predictions and see where you stand.
          Sessions resume where you left off.
        </p>
        <div className="mt-8 flex flex-wrap gap-3">
          <Button asChild shape="pill" variant="default-inverse">
            <Link href="/competitions">
              See competitions
              <ButtonArrow />
            </Link>
          </Button>
          <Button
            asChild
            className="text-on-band hover:bg-band-elevated"
            shape="pill"
            variant="ghost"
          >
            <Link href="/courses">How courses work</Link>
          </Button>
        </div>
      </FadeIn>

      <FadeIn aria-hidden className="space-y-4" delay={0.1}>
        <div className="bg-band-elevated rounded-2xl p-5">
          <div className="text-on-band-muted flex items-center justify-between text-xs">
            <span className="font-mono">churn.ipynb</span>
            <span className="flex items-center gap-1.5">
              <Play className="size-3" /> Python 3 · ready
            </span>
          </div>
          <div className="mt-4 space-y-2 font-mono text-[13px]">
            {CELL.map((line, index) => (
              <div className="flex gap-3" key={line}>
                <span className="text-on-band-muted shrink-0 font-mono">[{index + 1}]</span>
                <span className="text-on-band truncate font-mono">{line}</span>
              </div>
            ))}
            <div className="text-on-band border-t border-white/10 pt-2 font-mono">0.8734</div>
          </div>
        </div>

        <div className="bg-band-elevated rounded-2xl p-5">
          <div className="flex items-center justify-between">
            <span className="flex items-center gap-2 text-sm font-semibold">
              <Trophy className="size-4" /> Leaderboard
            </span>
            <span className="text-on-band-muted text-xs">ROC AUC · higher is better</span>
          </div>
          <ul className="mt-4 space-y-2.5">
            {[0.912, 0.897, 0.873, 0.861].map((score, index) => (
              <li
                className={cn(
                  "flex items-center gap-3 rounded-lg px-3 py-2 text-sm",
                  index === 2 && "bg-white/10",
                )}
                key={score}
              >
                <span className="w-4 font-mono">{index + 1}</span>
                {index === 2 ? (
                  <span className="flex-1 font-medium">You</span>
                ) : (
                  <span className="h-2 flex-1 rounded-full bg-white/15" />
                )}
                <span className="font-mono">{score.toFixed(3)}</span>
              </li>
            ))}
          </ul>
        </div>
      </FadeIn>
    </div>
  </section>
);

/* ----------------------------------- B2B ----------------------------------- */

const TEAM_POINTS = [
  { icon: Users, text: "Invite people one by one or by CSV, with roles" },
  { icon: BookOpen, text: "Assign courses to members or groups" },
  { icon: BarChart3, text: "Follow each member's progress from one dashboard" },
  { icon: Coins, text: "A flat rate per seat: assigning more courses doesn't change the bill" },
];

export const Teams = () => (
  <section className="container mx-auto px-4 py-20 lg:px-8 lg:py-28" id="teams">
    <div className="bg-teal-soft text-teal-soft-foreground relative grid items-center gap-12 overflow-hidden rounded-3xl p-8 lg:grid-cols-2 lg:p-14">
      <Ring accent="teal" className="absolute -top-10 -right-10" size={180} />
      <FadeIn className="relative">
        <h2 className="font-display text-3xl font-semibold tracking-tight lg:text-5xl">
          Train a team like you mean it
        </h2>
        <p className="mt-5 max-w-md text-lg leading-relaxed opacity-85">
          Onboard your organisation, assign courses and see real progress. Your people keep
          everything they earn, even if they move on.
        </p>
        <div className="mt-8 flex flex-wrap gap-3">
          <Button asChild shape="pill">
            <Link href="/for-teams">
              Datarango for teams
              <ButtonArrow />
            </Link>
          </Button>
          <Button asChild shape="pill" variant="secondary">
            <Link href="/contact">Book a demo</Link>
          </Button>
        </div>
      </FadeIn>
      <ul className="relative space-y-3">
        {TEAM_POINTS.map((point) => (
          <li
            className="bg-card text-foreground flex items-start gap-3 rounded-xl p-4"
            key={point.text}
          >
            <span className="bg-teal-tile text-teal-tile-foreground grid size-9 shrink-0 place-items-center rounded-lg">
              <point.icon className="size-4.5" />
            </span>
            <span className="pt-1.5 text-sm">{point.text}</span>
          </li>
        ))}
      </ul>
    </div>
  </section>
);

/* ------------------------------- instructors ------------------------------- */

/** Portrait cards from `INSTRUCTORS`; left out until there are real ones. */
export const Instructors = () => {
  if (INSTRUCTORS.length === 0) return null;
  return (
    <section className="container mx-auto px-4 py-20 lg:px-8 lg:py-28">
      <SectionHeading
        lede="People who do this work, teaching it."
        title="Learn from practitioners"
      />
      <Stagger className="mt-12 grid gap-5 sm:grid-cols-2 lg:grid-cols-4">
        {INSTRUCTORS.map((person) => (
          <StaggerItem key={person.name}>
            <div
              className={cn(
                "relative aspect-4/5 overflow-hidden rounded-2xl",
                ACCENT_CLASSES[person.accent].soft,
              )}
            >
              <Image
                alt={person.name}
                className="object-cover"
                fill
                sizes="(min-width: 1024px) 25vw, (min-width: 640px) 50vw, 100vw"
                src={person.photo}
              />
            </div>
            <h3 className="font-display text-foreground mt-4 text-lg font-semibold">
              {person.name}
            </h3>
            <p className="text-foreground-muted text-sm">
              {person.role} · {person.courseCount} {person.courseCount === 1 ? "course" : "courses"}
            </p>
          </StaggerItem>
        ))}
      </Stagger>
    </section>
  );
};

/* ------------------------------- testimonials ------------------------------ */

/** Quotes from `TESTIMONIALS`; left out until there are real ones. */
export const Testimonials = () => {
  if (TESTIMONIALS.length === 0) return null;
  return (
    <section className="container mx-auto px-4 py-20 lg:px-8 lg:py-28">
      <SectionHeading title="What learners say" />
      <Stagger className="mt-12 grid gap-5 lg:grid-cols-3">
        {TESTIMONIALS.map((item) => (
          <StaggerItem
            className="border-border bg-card flex flex-col gap-6 rounded-2xl border p-7"
            key={item.name}
          >
            <Quote aria-hidden className="text-primary size-6" />
            <p className="text-foreground flex-1 text-lg leading-relaxed">{item.quote}</p>
            <div className="flex items-center gap-3">
              {item.photo ? (
                <Image
                  alt=""
                  className="size-11 rounded-full object-cover"
                  height={44}
                  src={item.photo}
                  width={44}
                />
              ) : (
                <span className="bg-primary-soft text-primary-soft-foreground grid size-11 place-items-center rounded-full font-semibold">
                  {item.name.charAt(0)}
                </span>
              )}
              <div>
                <p className="text-foreground text-sm font-semibold">{item.name}</p>
                <p className="text-foreground-muted text-sm">{item.role}</p>
              </div>
            </div>
          </StaggerItem>
        ))}
      </Stagger>
    </section>
  );
};

/* -------------------------------- final cta -------------------------------- */

export const FinalCta = () => (
  <section className="container mx-auto px-4 pb-24 lg:px-8 lg:pb-32">
    <FadeIn className="bg-primary-soft text-primary-soft-foreground relative overflow-hidden rounded-3xl px-8 py-16 text-center lg:py-24">
      <Circle accent="primary" className="absolute -bottom-16 -left-16" size={200} />
      <h2 className="font-display relative mx-auto max-w-3xl text-4xl font-semibold tracking-tight lg:text-6xl">
        Your first notebook is one click away
      </h2>
      <p className="relative mx-auto mt-5 max-w-xl text-lg opacity-85">
        Join free, open a course, and be running real code in minutes.
      </p>
      <div className="relative mt-9 flex flex-wrap items-center justify-center gap-3">
        <Button asChild shape="pill" size="lg">
          <Link href="/signup">
            Join for free
            <ButtonArrow />
          </Link>
        </Button>
        <Button asChild shape="pill" size="lg" variant="secondary">
          <Link href="/for-teams">For teams and schools</Link>
        </Button>
      </div>
    </FadeIn>
  </section>
);
