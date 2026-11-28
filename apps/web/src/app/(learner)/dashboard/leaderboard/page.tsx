"use client";

import Link from "next/link";
import { Flame, Sparkles, Trophy } from "lucide-react";

import { Badge, Button, PageLayout, Skeleton, Statistics } from "@datarango/ui";

import { useLeaderboard, useStanding, type RankedPlayer } from "@/hooks/economy";

/** How many places the board shows. The server allows up to 100. */
const PLACES = 50;

/**
 * The learner leaderboard: everyone ranked by XP, with you highlighted.
 *
 * Its own page rather than a section of Achievements: the board is about
 * everybody, achievements are about you, and a ranking shown under your badges
 * read as one more thing you own.
 */
export default function LeaderboardPage() {
  const { data: board, isLoading } = useLeaderboard(PLACES);
  const { data: standing } = useStanding();

  const players = board?.players ?? [];
  const you = players.find((p) => p.isYou);

  return (
    <PageLayout title="Leaderboard" subtitle="Learners ranked by the XP they've earned.">
      {isLoading ? (
        <Skeleton skeleton="page" />
      ) : (
        <>
          <div className="grid grid-cols-2 gap-3 lg:grid-cols-3">
            <Statistics
              label="Your rank"
              value={you ? `#${you.rank}` : "–"}
              icon={Trophy}
              description={you ? undefined : `Not in the top ${PLACES} yet`}
            />
            <Statistics
              label="Your XP"
              value={(standing?.xp ?? 0).toLocaleString()}
              icon={Sparkles}
              description={`Level ${standing?.level ?? 1}`}
            />
            <Statistics
              label="Current streak"
              value={String(standing?.currentStreak ?? 0)}
              icon={Flame}
            />
          </div>

          {players.length === 0 ? (
            <div className="border-hairline bg-card rounded-xs border px-4 py-8 text-center text-sm">
              <p className="text-muted-foreground">
                Nobody has earned XP yet. Finish a lesson or pass a quiz to be first.
              </p>
              <Button asChild className="mt-4" size="sm" variant="secondary">
                <Link href="/dashboard/my-courses">Go to my courses</Link>
              </Button>
            </div>
          ) : (
            <ul className="border-hairline bg-card rounded-xs border">
              {players.map((player) => (
                <LeaderboardRow key={player.userId} player={player} />
              ))}
            </ul>
          )}
        </>
      )}
    </PageLayout>
  );
}

const LeaderboardRow = ({ player }: { player: RankedPlayer }) => (
  <li
    className={`border-hairline flex flex-wrap items-center gap-3 border-b px-4 py-3 text-sm last:border-b-0 ${
      player.isYou ? "bg-muted/40" : ""
    }`}
  >
    <span className="text-muted-foreground mono-data w-6 shrink-0 text-right text-xs">
      {player.rank}
    </span>
    <span className="text-ink min-w-0 flex-1 truncate font-medium">{player.displayName}</span>
    {player.isYou && <Badge variant="outline">You</Badge>}
    {player.currentStreak > 0 && (
      <span className="text-muted-foreground flex shrink-0 items-center gap-1 text-xs">
        <Flame className="size-3.5" />
        {player.currentStreak}
      </span>
    )}
    <span className="text-muted-foreground shrink-0 text-xs">Lv {player.level}</span>
    <span className="text-ink mono-data w-20 shrink-0 text-right font-medium">
      {player.xp.toLocaleString()}
    </span>
  </li>
);
