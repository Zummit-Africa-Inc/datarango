"use client";

import { Flame, Play, Trophy } from "lucide-react";
import Link from "next/link";

import { Button, FadeIn, TiltCard } from "@datarango/ui";

const NOTEBOOK_LINES = [
  { prompt: "In [1]:", code: "import pandas as pd" },
  { prompt: "In [2]:", code: 'df = pd.read_csv("sales.csv")' },
  { prompt: "In [3]:", code: 'df.groupby("region").sum()' },
];

const LEADERBOARD = [
  { rank: 1, name: "Adaeze O.", score: "0.9821" },
  { rank: 2, name: "Tunde A.", score: "0.9788" },
  { rank: 3, name: "Maryam S.", score: "0.9743" },
];

const CHART_BARS = [38, 62, 45, 80, 58, 92, 70];

/** Landing hero: oversized title + a 3D-posed product mosaic built in CSS. */
export const Hero = () => (
  <section className="relative overflow-hidden">
    <div className="from-primary-50/60 pointer-events-none absolute inset-0 -z-10 bg-linear-to-b to-transparent" />
    <div className="container mx-auto grid items-center gap-16 px-4 pt-20 pb-24 lg:grid-cols-2 lg:gap-8 lg:px-8 lg:pt-28 lg:pb-32">
      <FadeIn>
        <h1 className="font-heading mt-6 text-6xl leading-[0.95] tracking-tight lg:text-9xl">
          Play.
          <br />
          Learn.
          <br />
          <span className="text-primary-500">Build.</span>
        </h1>
        <p className="text-muted-foreground mt-8 max-w-md text-lg leading-relaxed">
          Master data analytics, AI and ML by doing — interactive courses, real Jupyter notebooks,
          hosted datasets and live competitions. One account for you; one console for your whole
          team or school.
        </p>
        <div className="mt-10 flex flex-wrap items-center gap-4">
          <Button asChild className="h-12 px-8 text-base" size="lg">
            <Link href="/signup">Start learning free</Link>
          </Button>
          <Button asChild className="h-12 px-8 text-base" size="lg" variant="outline">
            <Link href="/for-teams">Datarango for teams</Link>
          </Button>
        </div>
        <p className="text-muted-foreground mt-6 text-sm">
          Free for individuals — no credit card. Teams pay only for assigned courses.
        </p>
      </FadeIn>
      <div className="relative hidden h-135 perspective-[1400px] lg:block" aria-hidden>
        <div className="ember-bloom absolute top-1/3 left-1/3 -z-10 size-96 rounded-full" />
        <TiltCard
          className="bg-ink absolute top-6 left-0 w-95 rounded-xs p-5 text-white shadow-2xl"
          rotateX={6}
          rotateY={-14}
          float
        >
          <div className="flex items-center justify-between">
            <div className="flex gap-1.5">
              <span className="size-2.5 rounded-full bg-red-400" />
              <span className="size-2.5 rounded-full bg-yellow-400" />
              <span className="size-2.5 rounded-full bg-green-400" />
            </div>
            <span className="text-xs text-white/50">analysis.ipynb</span>
          </div>
          <div className="font-code mt-4 space-y-2 text-[13px]">
            {NOTEBOOK_LINES.map((line) => (
              <div className="flex gap-x-3" key={line.prompt}>
                <span className="text-primary-300 shrink-0">{line.prompt}</span>
                <span className="text-white/90">{line.code}</span>
              </div>
            ))}
          </div>
          <div className="mt-4 flex h-24 items-end gap-1.5 rounded-xs bg-white/5 p-3">
            {CHART_BARS.map((height, index) => (
              <span
                className="bg-primary-400 flex-1 rounded-xs"
                key={index}
                style={{ height: `${height}%` }}
              />
            ))}
          </div>
          <div className="mt-3 flex items-center gap-x-2 text-xs text-white/60">
            <Play className="size-3.5" /> Kernel ready · Python 3
          </div>
        </TiltCard>
        <TiltCard
          className="bg-card border-border absolute top-0 right-0 w-60 rounded-xs border p-4 shadow-xl"
          rotateX={4}
          rotateY={10}
        >
          <div className="flex items-center gap-x-2">
            <Trophy className="text-primary-500 size-4" />
            <p className="text-sm font-semibold">House Prices — Live</p>
          </div>
          <ul className="mt-3 space-y-2">
            {LEADERBOARD.map((row) => (
              <li className="flex items-center justify-between text-sm" key={row.rank}>
                <span className="flex items-center gap-x-2">
                  <span className="bg-accent text-accent-foreground grid size-5 place-items-center rounded-full text-[10px] font-medium">
                    {row.rank}
                  </span>
                  {row.name}
                </span>
                <span className="font-code text-muted-foreground text-xs">{row.score}</span>
              </li>
            ))}
          </ul>
        </TiltCard>
        <TiltCard
          className="bg-card border-border absolute right-10 bottom-10 w-55 rounded-xs border p-4 shadow-xl"
          rotateX={-4}
          rotateY={12}
          float
        >
          <div className="flex items-center justify-between">
            <span className="flex items-center gap-x-1.5 text-sm font-semibold">
              <Flame className="text-primary-500 size-4" /> 14-day streak
            </span>
            <span className="bg-primary-50 rounded-full px-2 py-0.5 text-xs font-semibold dark:text-white">
              +50 DRG
            </span>
          </div>
          <div className="mt-3 grid grid-cols-7 gap-1">
            {Array.from({ length: 14 }, (_, index) => (
              <span
                className={
                  index < 12 ? "bg-primary-400 h-6 rounded-xs" : "bg-primary-100 h-6 rounded-xs"
                }
                key={index}
              />
            ))}
          </div>
          <p className="text-muted-foreground mt-3 text-xs">
            Quiz passed — tokens credited to your wallet.
          </p>
        </TiltCard>
      </div>
    </div>
  </section>
);
