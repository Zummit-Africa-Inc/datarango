import { Coins, FileQuestion, Gauge, ListChecks, RefreshCw, Target } from "lucide-react";
import type { Metadata } from "next";

import { FeaturePreview } from "@/components/marketing/feature-preview";

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
    <FeaturePreview
      eyebrow="Quizzes"
      title={
        <>
          Prove it in <span className="text-primary-500">ten questions</span>
        </>
      }
      lede="Standalone-first quizzes across data, AI and ML — take them for tokens, meet them in courses, or face them as module gates."
      points={POINTS}
    />
  );
}
