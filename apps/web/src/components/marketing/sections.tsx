"use client";

import {
  Award,
  BadgeCheck,
  BarChart3,
  BookOpen,
  Check,
  Coins,
  Flame,
  NotebookPen,
  Play,
  Quote,
  Trophy,
  Users,
  type LucideIcon,
} from "lucide-react";
import Image from "next/image";
import Link from "next/link";
import type { ReactNode } from "react";

import {
  ACCENT_CLASSES,
  Button,
  ButtonArrow,
  Circle,
  FadeIn,
  HalfMoon,
  Ring,
  Stagger,
  StaggerItem,
  cn,
  type AccentToken,
} from "@datarango/ui";

import { INSTRUCTORS, PHOTOS, TESTIMONIALS, type Photo } from "@/content/marketing";

const SectionHeading = ({ title, lede }: { title: string; lede?: string }) => (
  <div className="mx-auto max-w-2xl text-center">
    <h2 className="font-display text-foreground text-3xl font-semibold tracking-tight lg:text-5xl">
      {title}
    </h2>
    {lede && <p className="text-foreground-muted mt-4 text-lg">{lede}</p>}
  </div>
);

/* ------------------------------ proof strip ------------------------------- */

const PROOF: { icon: LucideIcon; label: string }[] = [
  { icon: NotebookPen, label: "Live notebooks in the browser" },
  { icon: BadgeCheck, label: "Graded exercises in every module" },
  { icon: Trophy, label: "Competitions on real datasets" },
  { icon: Coins, label: "Tokens for learning, spent on courses" },
];

/** One line of what makes Datarango different, straight under the hero. */
export const ProofStrip = () => (
  <section className="border-border border-y">
    <ul className="container mx-auto grid grid-cols-1 gap-x-8 gap-y-4 px-4 py-8 sm:grid-cols-2 lg:grid-cols-4 lg:px-8">
      {PROOF.map((item) => (
        <li
          className="text-foreground flex items-center gap-3 text-sm font-medium"
          key={item.label}
        >
          <span className="bg-primary-soft text-primary-soft-foreground grid size-9 shrink-0 place-items-center rounded-full">
            <item.icon className="size-4" />
          </span>
          {item.label}
        </li>
      ))}
    </ul>
  </section>
);

/* --------------------------- value propositions --------------------------- */

/** Small product card laid over a photo, so each claim shows the thing itself. */
const Overlay = ({ children, className }: { children: ReactNode; className?: string }) => (
  <div
    aria-hidden
    className={cn(
      "border-border bg-card text-foreground absolute w-64 rounded-2xl border p-4 shadow-(--shadow-high)",
      className,
    )}
  >
    {children}
  </div>
);

const NotebookOverlay = () => (
  <>
    <div className="text-foreground-muted flex items-center justify-between text-xs">
      <span className="font-mono">churn.ipynb</span>
      <span className="flex items-center gap-1">
        <Play className="size-3" /> ready
      </span>
    </div>
    <p className="mt-3 truncate font-mono text-xs">model.fit(X_train, y_train)</p>
    <p className="mt-1.5 truncate font-mono text-xs">roc_auc_score(y_test, preds)</p>
    <p className="border-border mt-2 border-t pt-2 font-mono text-sm font-semibold">0.8734</p>
  </>
);

const ExerciseOverlay = () => (
  <>
    <p className="text-foreground-muted text-xs">Module 3 · graded exercise</p>
    <ul className="mt-3 space-y-2 text-sm">
      {["Loads the dataset", "Handles missing values", "Beats the baseline"].map((check) => (
        <li className="flex items-center gap-2" key={check}>
          <span className="bg-success-solid grid size-4.5 place-items-center rounded-full text-white">
            <Check className="size-3" strokeWidth={3} />
          </span>
          {check}
        </li>
      ))}
    </ul>
    <p className="text-success mt-3 text-sm font-semibold">Passed: module unlocked</p>
  </>
);

const LeaderboardOverlay = () => (
  <>
    <p className="flex items-center gap-2 text-sm font-semibold">
      <Trophy className="size-4" /> Leaderboard
    </p>
    <ul className="mt-3 space-y-1.5 text-sm">
      {[0.912, 0.897, 0.873].map((score, index) => (
        <li
          className={cn(
            "flex items-center gap-3 rounded-lg px-2 py-1.5",
            index === 2 && "bg-primary-soft",
          )}
          key={score}
        >
          <span className="w-3 font-mono">{index + 1}</span>
          {index === 2 ? (
            <span className="flex-1 font-medium">You</span>
          ) : (
            <span className="bg-muted h-2 flex-1 rounded-full" />
          )}
          <span className="font-mono">{score.toFixed(3)}</span>
        </li>
      ))}
    </ul>
  </>
);

const TokensOverlay = () => (
  <>
    <div className="flex items-center justify-between">
      <span className="flex items-center gap-1.5 text-sm font-semibold">
        <Flame className="size-4" /> 14-day streak
      </span>
      <span className="bg-amber-soft text-amber-soft-foreground rounded-full px-2 py-0.5 font-mono text-xs font-semibold">
        +50
      </span>
    </div>
    <p className="text-foreground-muted mt-2 text-xs">Quiz passed: tokens added to your wallet.</p>
    <p className="mt-3 flex items-center gap-2 text-sm">
      <Coins className="size-4" /> Spend them on any token-priced course
    </p>
  </>
);

interface Proposition {
  eyebrow: string;
  title: string;
  body: string;
  points: string[];
  photo: Photo;
  accent: AccentToken;
  overlay: ReactNode;
  cta: { href: string; label: string };
}

const PROPOSITIONS: Proposition[] = [
  {
    eyebrow: "Learn by doing",
    title: "Every lesson ends in real code",
    body: "Lessons open straight into a live Jupyter notebook with the dataset already mounted. No installs, no setup, and your work is saved where you left it.",
    points: [
      "Python and pandas in the browser",
      "Hosted, versioned datasets",
      "Sessions that resume",
    ],
    photo: PHOTOS.coding,
    accent: "violet",
    overlay: <NotebookOverlay />,
    cta: { href: "/courses", label: "How courses work" },
  },
  {
    eyebrow: "Proof, not watch time",
    title: "Skills you can show, not just say",
    body: "Every module ends with a graded exercise you have to pass to move on. Finish a course and you get a certificate anyone can verify online.",
    points: [
      "Auto-graded in seconds",
      "Certificates with a public check page",
      "Prerequisites stated up front",
    ],
    photo: PHOTOS.studying,
    accent: "amber",
    overlay: <ExerciseOverlay />,
    cta: { href: "/courses", label: "See what's graded" },
  },
  {
    eyebrow: "Real problems",
    title: "Compete on data that matters",
    body: "Score your models on real datasets against everyone else, watch the leaderboard move, and learn from what the top of the table does differently.",
    points: [
      "Public and private leaderboards",
      "Prizes for top places",
      "Private competitions for your organisation",
    ],
    photo: PHOTOS.analyst,
    accent: "sky",
    overlay: <LeaderboardOverlay />,
    cta: { href: "/competitions", label: "See competitions" },
  },
  {
    eyebrow: "Learning that pays back",
    title: "Earn while you learn",
    body: "Passing quizzes, keeping streaks and placing in competitions credit tokens to your wallet. Spend them on courses: progress you can't buy, and don't have to.",
    points: [
      "Tokens for quizzes and streaks",
      "Rewards for competition placings",
      "No card needed to start",
    ],
    photo: PHOTOS.earning,
    accent: "lime",
    overlay: <TokensOverlay />,
    cta: { href: "/pricing", label: "How tokens work" },
  },
];

/** The core value propositions as alternating photo + copy rows. */
export const Propositions = () => (
  <section className="container mx-auto space-y-24 px-4 py-20 lg:space-y-32 lg:px-8 lg:py-28">
    <SectionHeading
      lede="Built for people who learn by doing: practice is the course, everything else supports it."
      title="Why learners choose Datarango"
    />
    {PROPOSITIONS.map((item, index) => {
      const flip = index % 2 === 1;
      return (
        <FadeIn className="grid items-center gap-12 lg:grid-cols-2 lg:gap-20" key={item.title}>
          <div className={cn("relative", flip && "lg:order-2")}>
            {flip ? (
              <Circle accent={item.accent} className="absolute -top-8 -right-8" size={140} />
            ) : (
              <HalfMoon accent={item.accent} className="absolute -bottom-8 -left-8" size={140} />
            )}
            <div
              className={cn(
                "relative aspect-4/3 overflow-hidden rounded-3xl p-2.5",
                ACCENT_CLASSES[item.accent].soft,
              )}
            >
              <div className="relative h-full overflow-hidden rounded-2xl">
                <Image
                  alt={item.photo.alt}
                  className="object-cover"
                  fill
                  sizes="(min-width: 1024px) 45vw, 100vw"
                  src={item.photo.src}
                />
              </div>
            </div>
            <Overlay
              className={cn("hidden sm:block", flip ? "-bottom-8 -left-6" : "-right-6 -bottom-8")}
            >
              {item.overlay}
            </Overlay>
          </div>
          <div className={cn(flip && "lg:order-1")}>
            <p
              className={cn(
                "inline-flex rounded-full px-3 py-1 text-sm font-medium",
                ACCENT_CLASSES[item.accent].soft,
              )}
            >
              {item.eyebrow}
            </p>
            <h3 className="font-display text-foreground mt-5 text-3xl font-semibold tracking-tight lg:text-5xl">
              {item.title}
            </h3>
            <p className="text-foreground-muted mt-5 max-w-lg text-lg leading-relaxed">
              {item.body}
            </p>
            <ul className="mt-6 space-y-3">
              {item.points.map((point) => (
                <li className="text-foreground flex items-center gap-3" key={point}>
                  <span
                    className={cn(
                      "grid size-6 shrink-0 place-items-center rounded-full",
                      ACCENT_CLASSES[item.accent].tile,
                    )}
                  >
                    <Check className="size-3.5" strokeWidth={3} />
                  </span>
                  {point}
                </li>
              ))}
            </ul>
            <Button asChild className="mt-8" shape="pill" variant="secondary">
              <Link href={item.cta.href}>
                {item.cta.label}
                <ButtonArrow />
              </Link>
            </Button>
          </div>
        </FadeIn>
      );
    })}
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
    <div className="bg-teal-soft text-teal-soft-foreground relative grid items-center gap-10 overflow-hidden rounded-3xl p-6 lg:grid-cols-2 lg:gap-14 lg:p-10">
      <Ring accent="teal" className="absolute -top-10 -right-10" size={180} />
      <div className="relative aspect-4/3 overflow-hidden rounded-2xl lg:aspect-auto lg:h-full lg:min-h-96">
        <Image
          alt={PHOTOS.team.alt}
          className="object-cover"
          fill
          sizes="(min-width: 1024px) 45vw, 100vw"
          src={PHOTOS.team.src}
        />
      </div>
      <FadeIn className="relative lg:py-6">
        <p className="bg-teal-tile text-teal-tile-foreground inline-flex rounded-full px-3 py-1 text-sm font-medium">
          For teams and schools
        </p>
        <h2 className="font-display mt-5 text-3xl font-semibold tracking-tight lg:text-5xl">
          Train a team like you mean it
        </h2>
        <p className="mt-5 max-w-md text-lg leading-relaxed opacity-85">
          Onboard your organisation, assign courses and see real progress. Your people keep
          everything they earn, even if they move on.
        </p>
        <ul className="mt-6 space-y-3">
          {TEAM_POINTS.map((point) => (
            <li className="flex items-start gap-3" key={point.text}>
              <span className="bg-card text-foreground grid size-8 shrink-0 place-items-center rounded-lg">
                <point.icon className="size-4" />
              </span>
              <span className="pt-1">{point.text}</span>
            </li>
          ))}
        </ul>
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
    <FadeIn className="bg-primary-soft text-primary-soft-foreground relative grid items-center gap-10 overflow-hidden rounded-3xl p-8 lg:grid-cols-[1fr_auto] lg:p-14">
      <Circle accent="primary" className="absolute -bottom-16 -left-16" size={200} />
      <div className="relative">
        <h2 className="font-display max-w-2xl text-4xl font-semibold tracking-tight lg:text-6xl">
          Your first notebook is one click away
        </h2>
        <p className="mt-5 max-w-xl text-lg opacity-85">
          Join free, open a course, and be running real code in minutes.
        </p>
        <div className="mt-8 flex flex-wrap items-center gap-3">
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
      </div>
      <div className="relative hidden lg:block">
        <div className="relative size-64 overflow-hidden rounded-full">
          <Image
            alt="A graduate in cap and gown smiling over her shoulder"
            className="object-cover"
            fill
            sizes="16rem"
            src="/assets/marketing/graduate.jpg"
          />
        </div>
        <span className="bg-card text-foreground absolute -bottom-2 -left-6 flex items-center gap-2 rounded-full px-4 py-2 text-sm font-medium shadow-(--shadow-high)">
          <Award className="size-4" /> Certificate earned
        </span>
      </div>
    </FadeIn>
  </section>
);
