"use client";

import { useMemo } from "react";
import Link from "next/link";
import { Award, BadgeCheck, Flame, Lock, Sparkles } from "lucide-react";

import { Badge, Button, PageLayout, Skeleton, Statistics } from "@datarango/ui";

import { useMyCertificates } from "@/hooks/learning";
import {
  badgeProgress,
  useBadges,
  useLeaderboard,
  useStanding,
  type EarnableBadge,
  type RankedPlayer,
  type Standing,
} from "@/hooks/economy";

/**
 * Achievements.
 *
 * Live as of 2026-08-28. The page that stood here assembled certificates and
 * passed quizzes because gamification had no service behind it and a badge
 * shelf would have been a fiction rendered as a record. It has one now, so XP,
 * level, streak and badges are read from it — and the certificates stay,
 * because a verifiable certificate is a stronger claim than any badge and the
 * two belong on the same page.
 *
 * Unearned badges are shown alongside earned ones with their progress. A badge
 * case that displays only what you have tells you nothing about what to do
 * next, and the thresholds are public information the server already serves to
 * anybody.
 */
export default function AchievementsPage() {
  const { data: standing, isLoading: loadingStanding } = useStanding();
  const { data: badgeData, isLoading: loadingBadges } = useBadges();
  const { data: board } = useLeaderboard(10);
  const { data: certificates } = useMyCertificates();

  const badges = badgeData?.badges ?? [];
  const issued = certificates?.certificates ?? [];
  const loading = loadingStanding || loadingBadges;

  const { earned, locked } = useMemo(
    () => ({
      earned: badges.filter((b) => b.earnedAt !== null),
      locked: badges.filter((b) => b.earnedAt === null),
    }),
    [badges],
  );

  return (
    <PageLayout
      title="Achievements"
      subtitle="What you've earned, what you're close to, and what it's on record for."
    >
      {loading ? (
        <Skeleton skeleton="page" />
      ) : (
        <>
          <div className="grid grid-cols-2 gap-3 lg:grid-cols-4">
            <Statistics
              label="Level"
              value={String(standing?.level ?? 1)}
              icon={Sparkles}
              description={`${(standing?.xp ?? 0).toLocaleString()} XP total`}
            />
            <Statistics
              label="Current streak"
              value={String(standing?.currentStreak ?? 0)}
              icon={Flame}
              description={
                standing?.longestStreak
                  ? `Best: ${standing.longestStreak} day${standing.longestStreak === 1 ? "" : "s"}`
                  : "Come back tomorrow to start one"
              }
            />
            <Statistics
              label="Badges"
              value={`${earned.length}/${badges.length}`}
              icon={Award}
            />
            <Statistics
              label="Certificates"
              value={String(issued.length)}
              icon={BadgeCheck}
              description={issued.length > 0 ? "Publicly verifiable" : undefined}
            />
          </div>

          {standing && <LevelBar standing={standing} />}

          <section>
            <h2 className="font-heading text-ink mb-3 text-lg">
              Badges {earned.length > 0 && <span className="text-muted-foreground text-sm">· {earned.length} earned</span>}
            </h2>
            {badges.length === 0 ? (
              <p className="text-muted-foreground border-hairline bg-card rounded-xs border px-4 py-8 text-center text-sm">
                No badges are configured yet.
              </p>
            ) : (
              <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
                {[...earned, ...locked].map((badge) => (
                  <BadgeCard badge={badge} key={badge.id} standing={standing} />
                ))}
              </div>
            )}
          </section>

          {board && board.players.length > 1 && (
            <section>
              <h2 className="font-heading text-ink mb-3 text-lg">Leaderboard</h2>
              <ul className="border-hairline bg-card rounded-xs border">
                {board.players.map((player) => (
                  <LeaderboardRow key={player.userId} player={player} />
                ))}
              </ul>
            </section>
          )}

          <section>
            <h2 className="font-heading text-ink mb-3 text-lg">Certificates</h2>
            {issued.length === 0 ? (
              <p className="text-muted-foreground border-hairline bg-card rounded-xs border px-4 py-8 text-center text-sm">
                Complete every module of a course — lessons and end-of-module exercises — and a
                certificate is issued automatically.
              </p>
            ) : (
              <ul className="border-hairline bg-card rounded-xs border">
                {issued.map((certificate) => (
                  <li
                    className="border-hairline flex flex-wrap items-center gap-3 border-b px-4 py-3 text-sm last:border-b-0"
                    key={certificate.id}
                  >
                    <BadgeCheck className="size-4 shrink-0 text-emerald-600" />
                    <span className="text-ink min-w-0 flex-1 truncate font-medium">
                      {certificate.courseTitle}
                    </span>
                    <code className="text-muted-foreground font-code shrink-0 text-xs">
                      {certificate.serial}
                    </code>
                    <Button asChild size="sm" variant="ghost">
                      {/* The public verification page — the serial is the whole
                          capability, which is why it is safe to link. */}
                      <Link href={`/verify/${certificate.serial}`}>Verify</Link>
                    </Button>
                  </li>
                ))}
              </ul>
            )}
          </section>
        </>
      )}
    </PageLayout>
  );
}

/**
 * Progress through the current level, not through all XP ever. The server sends
 * both numbers for exactly this reason — a bar fed the raw total fills once and
 * never moves again.
 */
const LevelBar = ({ standing }: { standing: Standing }) => {
  const percent =
    standing.xpForLevel > 0
      ? Math.min(100, Math.round((standing.xpIntoLevel / standing.xpForLevel) * 100))
      : 0;

  return (
    <div className="border-hairline bg-card rounded-xs border px-4 py-3">
      <div className="flex items-center justify-between text-sm">
        <span className="text-ink font-medium">Level {standing.level}</span>
        <span className="text-muted-foreground mono-data text-xs">
          {standing.xpIntoLevel.toLocaleString()} / {standing.xpForLevel.toLocaleString()} XP to
          level {standing.level + 1}
        </span>
      </div>
      <div
        aria-label={`Level ${standing.level}, ${percent}% to level ${standing.level + 1}`}
        aria-valuemax={100}
        aria-valuemin={0}
        aria-valuenow={percent}
        className="bg-muted mt-2 h-1.5 w-full overflow-hidden rounded-full"
        role="progressbar"
      >
        <div className="bg-primary-500 h-full rounded-full transition-[width]" style={{ width: `${percent}%` }} />
      </div>
    </div>
  );
};

const BadgeCard = ({ badge, standing }: { badge: EarnableBadge; standing: Standing | undefined }) => {
  const isEarned = badge.earnedAt !== null;
  const progress = Math.min(badgeProgress(badge, standing), badge.threshold);

  return (
    <div
      className={`border-hairline rounded-xs border p-4 ${isEarned ? "bg-card" : "bg-muted/30"}`}
    >
      <div className="flex items-start gap-3">
        {isEarned ? (
          <Award className="size-5 shrink-0 text-amber-500" strokeWidth={1.5} />
        ) : (
          <Lock className="text-muted-foreground size-5 shrink-0" strokeWidth={1.5} />
        )}
        <div className="min-w-0 flex-1">
          <p className={`truncate font-medium ${isEarned ? "text-ink" : "text-muted-foreground"}`}>
            {badge.name}
          </p>
          <p className="text-muted-foreground mt-0.5 text-xs">{badge.description}</p>

          {isEarned ? (
            <p className="text-muted-foreground mt-2 text-xs">
              Earned {new Date(badge.earnedAt!).toLocaleDateString()}
            </p>
          ) : (
            // The number, not just a bar: "7 of 10" is what tells somebody
            // whether it is worth one more push tonight.
            <p className="text-muted-foreground mono-data mt-2 text-xs">
              {progress.toLocaleString()} / {badge.threshold.toLocaleString()}
            </p>
          )}
        </div>
      </div>
    </div>
  );
};

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
