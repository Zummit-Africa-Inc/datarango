import { Building2, Flame, LockKeyhole, Medal, Timer, TrendingUp } from "lucide-react";
import type { Metadata } from "next";

import { ProductPage } from "@/components/marketing/feature-preview";
import { PHOTOS } from "@/content/marketing";

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
    <ProductPage
      accent="rose"
      appHref="/dashboard/competitions"
      eyebrow="Competitions"
      lede="Real datasets, automated scoring and live leaderboards. Competition is how practice stops being optional."
      overlay={
        <>
          <p className="flex items-center justify-between text-sm font-semibold">
            Leaderboard <span className="text-foreground-muted text-xs font-normal">ROC AUC</span>
          </p>
          <ul className="mt-3 space-y-1.5 text-sm">
            {[0.912, 0.897, 0.873].map((score, index) => (
              <li
                className={
                  index === 2
                    ? "bg-primary-soft flex gap-3 rounded-lg px-2 py-1"
                    : "flex gap-3 px-2 py-1"
                }
                key={score}
              >
                <span className="font-mono">{index + 1}</span>
                <span className="flex-1">{index === 2 ? "You" : ""}</span>
                <span className="font-mono">{score.toFixed(3)}</span>
              </li>
            ))}
          </ul>
        </>
      }
      photo={PHOTOS.pair}
      points={POINTS}
      story={{
        eyebrow: "Better together",
        title: "Learn from the top of the table",
        body: "Submit predictions, watch your place move, and see what the leaders did differently. Prizes go to the top places when a competition closes.",
        bullets: [
          "Public and private leaderboards",
          "Token prizes for top places",
          "Private competitions for your organisation",
        ],
        photo: PHOTOS.analyst,
      }}
      title="Practice, but make it a sport"
    />
  );
}
