"use client";

import Image from "next/image";
import Link from "next/link";
import { BarChart3, BookOpen, Coins, NotebookPen, Trophy, Users } from "lucide-react";

import { Gif } from "./gif";
import {
  BusinessIllustration,
  Button,
  CreditIllustration,
  FadeIn,
  InvestmentIllustration,
  Stagger,
  StaggerItem,
} from "@datarango/ui";

/* -------------------------------- tool strip ------------------------------- */

const TOOLS = [
  { name: "Python", logo: "/assets/images/python.png" },
  { name: "pandas", logo: "/assets/images/pandas.png" },
  { name: "Jupyter", logo: "/assets/images/jupyter.png" },
  { name: "TensorFlow", logo: "/assets/images/tensorflow.png" },
  { name: "SQL", logo: "/assets/images/sql.png" },
  { name: "R", logo: "/assets/images/r.png" },
];

export const ToolStrip = () => (
  <section className="border-border/60 border-y">
    <div className="container mx-auto flex flex-wrap items-center justify-center gap-x-12 gap-y-6 px-4 py-10 lg:px-8">
      <p className="text-muted-foreground w-full text-center text-xs font-semibold tracking-widest uppercase">
        Learn the tools the industry runs on
      </p>
      {TOOLS.map((tool) => (
        <span className="flex items-center gap-x-2 opacity-70" key={tool.name}>
          <span className="relative size-6">
            <Image alt={tool.name} fill sizes="24px" src={tool.logo} className="object-contain" />
          </span>
          <span className="text-sm font-medium">{tool.name}</span>
        </span>
      ))}
    </div>
  </section>
);

/* --------------------------------- features -------------------------------- */

const FEATURES = [
  {
    icon: BookOpen,
    title: "Courses that make you do the work",
    body: "Video, text and audio lessons — and every module ends with a graded exercise you can't skip.",
    image: "",
    color: "#E26666",
  },
  {
    icon: NotebookPen,
    title: "Real Jupyter notebooks",
    body: "CPU-backed kernels in the browser with persistent storage. Close the tab, come back, resume exactly where you left off.",
    image: "",
    color: "#0A1A4D",
  },
  {
    icon: CreditIllustration,
    title: "Competitions & leaderboards",
    body: "Kaggle-style scoring pipelines with public and private leaderboards — plus private competitions for your org.",
    image: "",
    color: "#66BDE2",
  },
  {
    icon: InvestmentIllustration,
    title: "Earn while you learn",
    body: "Quizzes and streaks credit tokens to your wallet. Redeem them for courses and perks.",
    image: "",
    color: "#1FAD64",
  },
  {
    icon: BusinessIllustration,
    title: "Hosted datasets",
    body: "Versioned, quota-managed datasets that mount read-only into your notebooks. No downloads, no setup.",
    image: "",
    color: "#F28A00",
  },
  {
    icon: Trophy,
    title: "Certificates that verify",
    body: "Course completion issues a certificate with a public verification page you can share anywhere.",
    image: "",
    color: "#9C66E2",
  },
];

export const Features = () => (
  <section className="container mx-auto px-4 py-24 lg:px-8 lg:py-32">
    <FadeIn className="mx-auto max-w-2xl text-center">
      <h2 className="font-heading text-4xl tracking-tight lg:text-6xl">
        Everything between <span className="text-primary-500">curious</span> and{" "}
        <span className="text-primary-500">hired</span>
      </h2>
      <p className="text-muted-foreground mt-6 text-lg">
        One platform for the whole journey — structured learning, real practice, public proof.
      </p>
    </FadeIn>
    <Stagger className="mt-16 grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
      {FEATURES.map((feature) => {
        return (
          <StaggerItem
            className="group border-border bg-on-ink-muted rounded-xs border transition-colors"
            key={feature.title}
          >
            <div className="h-30 space-y-2 p-4">
              <h3 className="font-heading text-ink text-xl">{feature.title}</h3>
              <p className="text-ink text-sm leading-relaxed">{feature.body}</p>
            </div>
            <div className="bg-ink flex h-70 justify-end overflow-hidden">
              <feature.icon className="text-on-ink size-70 grayscale-100" />
            </div>
          </StaggerItem>
        );
      })}
    </Stagger>
  </section>
);

/* --------------------------------- showcase -------------------------------- */

const SHOWCASE = [
  {
    title: "Learning that feels like building",
    body: "Lessons open straight into a live notebook. Write real code against real datasets, get auto-graded feedback in seconds, and keep every file you touch.",
    image: "learning",
    href: "/courses",
    cta: "Browse courses",
  },
  {
    title: "Competition keeps you honest",
    body: "Submit predictions, watch the leaderboard move, and learn from what the top of the table does differently. Streaks, XP and badges keep the momentum daily.",
    image: "competition",
    href: "/competitions",
    cta: "See competitions",
  },
];

export const Showcase = () => (
  <section className="container mx-auto space-y-24 px-4 pb-24 lg:px-8 lg:pb-32">
    {SHOWCASE.map((item, index) => (
      <FadeIn
        className={`flex flex-col items-center gap-12 lg:flex-row lg:gap-20 ${
          index % 2 === 1 ? "lg:flex-row-reverse" : ""
        }`}
        key={item.title}
      >
        <div className="relative aspect-5/3 w-full lg:w-1/2">
          <Gif title={item.image} />
        </div>
        <div className="w-full lg:w-1/2">
          <h3 className="font-heading text-3xl tracking-tight lg:text-5xl">{item.title}</h3>
          <p className="text-muted-foreground mt-6 max-w-lg text-lg leading-relaxed">{item.body}</p>
          <Button asChild className="mt-8" variant="outline">
            <Link href={item.href}>{item.cta}</Link>
          </Button>
        </div>
      </FadeIn>
    ))}
  </section>
);

/* ----------------------------------- B2B ----------------------------------- */

const TEAM_POINTS = [
  { icon: Users, text: "Invite your whole cohort — single or CSV bulk invites, roles included" },
  { icon: BookOpen, text: "Assign courses to members or groups and gate progress with exercises" },
  { icon: BarChart3, text: "Track per-member, per-course progress from one dashboard" },
  {
    icon: Coins,
    text: "Postpaid billing — pay per assigned course, see the meter before the invoice",
  },
];

const TEAM_PROGRESS = [
  { label: "Data Analysis Fundamentals", value: 82 },
  { label: "Machine Learning Basics", value: 64 },
  { label: "SQL for Analysts", value: 91 },
];

export const Teams = () => (
  <section className="bg-ink text-white" id="teams">
    <div className="container mx-auto grid items-center gap-16 px-4 py-24 lg:grid-cols-2 lg:px-8 lg:py-32">
      <FadeIn>
        <p className="text-primary-300 text-xs font-semibold tracking-widest uppercase">
          Datarango for Teams & Schools
        </p>
        <h2 className="font-heading text-on-ink mt-4 text-4xl tracking-tight lg:text-6xl">
          Train a team like
          <br />
          you mean it
        </h2>
        <p className="mt-6 max-w-md text-lg leading-relaxed text-white/70">
          Onboard your organization, assign courses, and watch real progress — while your people
          keep everything they earn, even if they move on.
        </p>
        <ul className="mt-10 space-y-4">
          {TEAM_POINTS.map((point) => (
            <li className="flex items-start gap-x-3" key={point.text}>
              <point.icon className="text-primary-300 mt-0.5 size-5 shrink-0" strokeWidth={1.5} />
              <span className="text-white/85">{point.text}</span>
            </li>
          ))}
        </ul>
        <div className="mt-10 flex flex-wrap gap-4">
          <Button asChild className="bg-primary-500 hover:bg-primary-400 h-12 px-8 text-white">
            <Link href="/for-teams">Explore Datarango for teams</Link>
          </Button>
          <Button
            asChild
            className="h-12 border-white/30 bg-transparent px-8 text-white hover:bg-white/10"
            variant="outline"
          >
            <Link href="/contact">Book a demo</Link>
          </Button>
        </div>
      </FadeIn>
      <FadeIn className="hidden lg:block" delay={0.15}>
        <div className="rounded-xs border border-white/10 bg-white/5 p-6 backdrop-blur" aria-hidden>
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
              <div className="rounded-xs bg-white/5 p-4" key={stat.label}>
                <p className="text-xs text-white/50">{stat.label}</p>
                <p className="mono-data mt-1 text-2xl">{stat.value}</p>
              </div>
            ))}
          </div>
          <div className="mt-6 space-y-4">
            {TEAM_PROGRESS.map((course) => (
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
        </div>
      </FadeIn>
    </div>
  </section>
);

/* ---------------------------------- stats ---------------------------------- */

const STATS = [
  { value: "12k+", label: "Learners building daily" },
  { value: "150+", label: "Courses & guided projects" },
  { value: "40+", label: "Live competitions run" },
  { value: "80+", label: "Teams & schools onboard" },
];

export const StatsBand = () => (
  <section className="border-hairline bg-canvas-soft border-y">
    <div className="container mx-auto grid grid-cols-2 gap-10 px-4 py-16 text-center lg:grid-cols-4 lg:px-8 lg:py-20">
      {STATS.map((stat) => (
        <FadeIn key={stat.label}>
          <p className="mono-data text-primary-600 text-4xl lg:text-5xl">{stat.value}</p>
          <p className="text-muted-foreground mt-2 text-sm">{stat.label}</p>
        </FadeIn>
      ))}
    </div>
  </section>
);

/* ------------------------------- testimonials ------------------------------ */

const TESTIMONIALS = [
  {
    quote:
      "The end-of-module exercises are brutal in the best way. I stopped collecting certificates and started actually shipping analysis.",
    name: "Chidinma E.",
    role: "Data Analyst, Lagos",
  },
  {
    quote:
      "We assigned three courses to forty interns and could finally see who was progressing — the usage meter made billing a non-event.",
    name: "Kwame B.",
    role: "L&D Lead, Fintech",
  },
  {
    quote:
      "Notebook sessions that just resume where I stopped, on my school laptop, with the dataset already mounted. That's the whole pitch.",
    name: "Aisha M.",
    role: "MSc student",
  },
];

export const Testimonials = () => (
  <section className="container mx-auto px-4 py-24 lg:px-8 lg:py-32">
    <FadeIn className="mx-auto max-w-2xl text-center">
      <h2 className="font-heading text-4xl tracking-tight lg:text-5xl">
        Real people. Real experiences
      </h2>
    </FadeIn>
    <Stagger className="mt-16 grid gap-6 lg:grid-cols-3">
      {TESTIMONIALS.map((item) => (
        <StaggerItem
          className="border-border bg-card flex flex-col rounded-xs border p-8"
          key={item.name}
        >
          <p className="flex-1 text-lg leading-relaxed">“{item.quote}”</p>
          <div className="mt-8 flex items-center gap-x-3">
            <span className="bg-primary-100 text-primary-700 grid size-10 place-items-center rounded-full text-sm font-medium">
              {item.name.charAt(0)}
            </span>
            <div>
              <p className="text-sm font-semibold">{item.name}</p>
              <p className="text-muted-foreground text-xs">{item.role}</p>
            </div>
          </div>
        </StaggerItem>
      ))}
    </Stagger>
  </section>
);

/* ----------------------------------- CTA ----------------------------------- */

export const FinalCta = () => (
  <section className="container mx-auto px-4 py-24 lg:px-8 lg:py-32">
    <FadeIn className="border-border from-primary-50 rounded-xs border bg-linear-to-br to-transparent px-8 py-20 text-center lg:py-28">
      <h2 className="font-heading mx-auto max-w-3xl text-4xl tracking-tight lg:text-7xl">
        Your first notebook is <span className="text-primary-500">one click</span> away
      </h2>
      <p className="text-muted-foreground mx-auto mt-6 max-w-xl text-lg">
        Join free, open a course, and be running real code in minutes.
      </p>
      <div className="mt-10 flex flex-wrap items-center justify-center gap-4">
        <Button asChild className="h-12 px-8 text-base" size="lg">
          <Link href="/signup">Join for free</Link>
        </Button>
        <Button asChild className="h-12 px-8 text-base" size="lg" variant="outline">
          <Link href="/for-teams">For teams & schools</Link>
        </Button>
      </div>
    </FadeIn>
  </section>
);
