import { Building2, Flame, LockKeyhole, Medal, Timer, TrendingUp } from "lucide-react";
import type { Metadata } from "next";

import { FeaturePreview } from "@/components/marketing/feature-preview";

export const metadata: Metadata = {
  title: "Competitions",
  description:
    "Kaggle-style competitions with automated scoring, public and private leaderboards, and org-private events.",
};

const POINTS = [
  {
    icon: TrendingUp,
    title: "Automated scoring",
    body: "Submit predictions; an isolated scoring pipeline evaluates them against hidden ground truth in minutes.",
  },
  {
    icon: Medal,
    title: "Two leaderboards",
    body: "A public board scores a split of the test data while the competition runs; final ranks come from the private split at close.",
  },
  {
    icon: Timer,
    title: "Rules per competition",
    body: "Submission limits per day, team policies and timelines are set per competition and enforced automatically.",
  },
  {
    icon: LockKeyhole,
    title: "Ground truth stays hidden",
    body: "Answer keys never leave the scoring container — probing the test set gets you removed, not ranked.",
  },
  {
    icon: Building2,
    title: "Private org competitions",
    body: "Teams and schools can run members-only competitions on their own datasets, scored on the same pipeline.",
  },
  {
    icon: Flame,
    title: "It feeds your streak",
    body: "Submissions count as learning activity — XP, streaks and badges all move when you compete.",
  },
];

export default function CompetitionsPage() {
  return (
    <FeaturePreview
      eyebrow="Competitions"
      title={
        <>
          Practice, but make it <span className="text-primary-500">a sport</span>
        </>
      }
      lede="Real datasets, automated scoring, live leaderboards. Competition is how practice stops being optional."
      points={POINTS}
    />
  );
}
