import { Coins, FileQuestion, Gauge, ListChecks, RefreshCw, Target } from "lucide-react";
import type { Metadata } from "next";

import { ProductPage } from "@/components/marketing/feature-preview";
import { PHOTOS } from "@/content/marketing";

export const metadata: Metadata = {
  title: "Quizzes",
  description:
    "Standalone quizzes with token rewards — test yourself on data, AI and ML topics, or meet them inside courses.",
};

const POINTS = [
  {
    icon: FileQuestion,
    title: "A library of their own",
    body: "Quizzes aren't just course furniture — browse the standalone library and take any published quiz directly.",
  },
  {
    icon: ListChecks,
    title: "Real question types",
    body: "Multiple choice, multi-select, short answer with pattern matching, and code snippets — auto-graded instantly.",
  },
  {
    icon: Coins,
    title: "Token rewards",
    body: "Creators attach token rewards to quizzes. Pass and your wallet is credited — redeemable against courses.",
  },
  {
    icon: Gauge,
    title: "Limits that keep it honest",
    body: "Attempt limits, time limits and pass thresholds are set per quiz; timers are verified server-side.",
  },
  {
    icon: Target,
    title: "Context counts",
    body: "The same quiz can be a standalone challenge, a course lesson, or a module gate — your attempts count where you made them.",
  },
  {
    icon: RefreshCw,
    title: "No reward farming",
    body: "Rewards are idempotent per rule and capped — passing the same quiz across contexts never double-pays.",
  },
];

export default function QuizzesPage() {
  return (
    <ProductPage
      accent="amber"
      appHref="/dashboard/quizzes"
      eyebrow="Quizzes"
      lede="Short quizzes across data, AI and ML. Take them on their own for tokens, meet them inside courses, or face them as module gates."
      overlay={
        <>
          <p className="text-foreground-muted text-xs">Question 7 of 10</p>
          <p className="mt-1 text-sm font-semibold">
            Which join keeps every row from the left table?
          </p>
          <ul className="mt-3 space-y-1.5 text-sm">
            <li className="border-border rounded-lg border px-3 py-1.5">INNER JOIN</li>
            <li className="border-primary bg-primary-soft rounded-lg border px-3 py-1.5">
              LEFT JOIN
            </li>
          </ul>
        </>
      }
      photo={PHOTOS.campus}
      points={POINTS}
      story={{
        eyebrow: "Quick wins",
        title: "Ten minutes, real progress",
        body: "A quiz is the fastest way to check what stuck. Pass one and tokens land in your wallet, ready to spend on a course.",
        bullets: [
          "Auto-graded the moment you submit",
          "Tokens for passing",
          "Fair limits, timed on the server",
        ],
        photo: PHOTOS.earning,
      }}
      title="Prove it in ten questions"
    />
  );
}
