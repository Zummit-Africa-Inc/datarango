"use client";

import { CalendarClock, Coins, Gauge, Trophy, Users } from "lucide-react";
import Link from "next/link";
import { useEffect, useState } from "react";

import { Badge, CatalogueThumbnail, cn } from "@datarango/ui";

import {
  METRIC_LABELS,
  type Competition,
  type CompetitionPhase,
  type DiscoveredCompetition,
} from "@/hooks/arena";

/**
 * Where a competition is for a learner. Mirrors arena's discover filter: an
 * open competition before its start is upcoming, and one past its end is
 * ended even if the sweeper hasn't closed it yet.
 */
export const competitionPhase = (c: Competition, now = Date.now()): CompetitionPhase => {
  if (c.status === "closed") return "ended";
  if (c.endsAt && new Date(c.endsAt).getTime() <= now) return "ended";
  if (c.startsAt && new Date(c.startsAt).getTime() > now) return "upcoming";
  return "live";
};

export const PHASE_LABELS: Record<CompetitionPhase, string> = {
  upcoming: "Upcoming",
  live: "Live",
  ended: "Ended",
};

/** "3d 4h", "5h 12m", "12m", "under a minute". */
export const formatDuration = (ms: number): string => {
  const minutes = Math.floor(ms / 60_000);
  if (minutes < 1) return "under a minute";
  const days = Math.floor(minutes / 1440);
  const hours = Math.floor((minutes % 1440) / 60);
  const mins = minutes % 60;
  if (days > 0) return hours > 0 ? `${days}d ${hours}h` : `${days}d`;
  if (hours > 0) return mins > 0 ? `${hours}h ${mins}m` : `${hours}h`;
  return `${mins}m`;
};

const dateFormat = new Intl.DateTimeFormat(undefined, { day: "numeric", month: "short" });

/** Re-renders every minute, so countdowns stay current without a reload. */
export const useNow = (intervalMs = 60_000) => {
  const [now, setNow] = useState(() => Date.now());
  useEffect(() => {
    const id = setInterval(() => setNow(Date.now()), intervalMs);
    return () => clearInterval(id);
  }, [intervalMs]);
  return now;
};

/** The one line about time that matters for this phase. */
export const deadlineLabel = (c: Competition, now: number): string | null => {
  const phase = competitionPhase(c, now);
  if (phase === "upcoming" && c.startsAt) {
    return `Starts in ${formatDuration(new Date(c.startsAt).getTime() - now)}`;
  }
  if (phase === "live") {
    return c.endsAt
      ? `Ends in ${formatDuration(new Date(c.endsAt).getTime() - now)}`
      : "No end date";
  }
  const ended = c.endsAt ?? c.updatedAt;
  return `Ended ${dateFormat.format(new Date(ended))}`;
};

export const PhaseBadge = ({ phase }: { phase: CompetitionPhase }) =>
  phase === "live" ? (
    <Badge appearance="solid" tone="success">
      <span aria-hidden className="relative flex size-1.5">
        <span className="absolute inline-flex size-full animate-ping rounded-full bg-white/80 motion-reduce:animate-none" />
        <span className="relative inline-flex size-1.5 rounded-full bg-white" />
      </span>
      Live
    </Badge>
  ) : phase === "upcoming" ? (
    <Badge tone="info">Upcoming</Badge>
  ) : (
    <Badge appearance="outline" tone="neutral">
      Ended
    </Badge>
  );

export const PrizeLabel = ({ competition }: { competition: Competition }) =>
  competition.tokenRewardTotal > 0 ? (
    <span className="inline-flex items-center gap-1.5">
      <Coins aria-hidden className="size-4" />
      <span className="font-mono">{competition.tokenRewardTotal.toLocaleString()}</span> tokens
    </span>
  ) : (
    <span className="inline-flex items-center gap-1.5">
      <Trophy aria-hidden className="size-4" />
      Kudos
    </span>
  );

const participantsLabel = (n: number) =>
  `${n.toLocaleString()} ${n === 1 ? "participant" : "participants"}`;

interface CardProps {
  competition: DiscoveredCompetition;
  now: number;
}

/** Grid card (§7.7): status, prize, participants, deadline. */
export const CompetitionCard = ({ competition, now }: CardProps) => {
  const phase = competitionPhase(competition, now);
  return (
    <Link
      className="border-border bg-card hover:border-border-strong focus-visible:ring-ring group flex h-full flex-col overflow-hidden rounded-lg border transition-colors outline-none focus-visible:ring-2"
      href={`/dashboard/competitions/${competition.id}`}
    >
      <CatalogueThumbnail icon={Trophy} id={competition.id} title={competition.title}>
        <div className="absolute top-3 left-3">
          <PhaseBadge phase={phase} />
        </div>
        {competition.orgId && (
          <div className="absolute top-3 right-3">
            <Badge appearance="solid" tone="neutral">
              Your organisation
            </Badge>
          </div>
        )}
      </CatalogueThumbnail>
      <div className="flex flex-1 flex-col gap-3 p-4">
        <div>
          <h2 className="font-display text-foreground line-clamp-1 text-lg font-semibold group-hover:underline group-hover:underline-offset-2">
            {competition.title}
          </h2>
          <p className="text-foreground-muted mt-1 line-clamp-2 text-sm">
            {competition.summary || "No summary yet."}
          </p>
        </div>
        <div className="text-foreground-muted mt-auto flex flex-wrap items-center gap-x-4 gap-y-1.5 text-sm">
          <PrizeLabel competition={competition} />
          <span className="inline-flex items-center gap-1.5">
            <Users aria-hidden className="size-4" />
            {participantsLabel(competition.participantCount)}
          </span>
        </div>
        <div className="border-border text-foreground-muted flex items-center justify-between border-t pt-3 text-xs">
          <span
            className={cn(
              "inline-flex items-center gap-1.5",
              phase === "live" && "text-foreground font-medium",
            )}
          >
            <CalendarClock aria-hidden className="size-3.5" />
            {deadlineLabel(competition, now)}
          </span>
          <span className="inline-flex items-center gap-1">
            <Gauge aria-hidden className="size-3.5" />
            {METRIC_LABELS[competition.metric]}
          </span>
        </div>
      </div>
    </Link>
  );
};

/** List view row. */
export const CompetitionRow = ({ competition, now }: CardProps) => {
  const phase = competitionPhase(competition, now);
  return (
    <Link
      className="hover:bg-muted/60 border-border flex items-center gap-4 border-b px-3 py-3 transition-colors last:border-0"
      href={`/dashboard/competitions/${competition.id}`}
    >
      <CatalogueThumbnail
        className="w-28 shrink-0 rounded-lg"
        icon={Trophy}
        id={competition.id}
        title={competition.title}
      />
      <div className="min-w-0 flex-1">
        <div className="flex items-center gap-2">
          <PhaseBadge phase={phase} />
          <h2 className="font-display text-foreground truncate font-semibold">
            {competition.title}
          </h2>
        </div>
        <p className="text-foreground-muted mt-1 truncate text-sm">
          {competition.summary || "No summary yet."}
        </p>
      </div>
      <div className="text-foreground-muted hidden shrink-0 flex-col items-end gap-1 text-sm sm:flex">
        <PrizeLabel competition={competition} />
        <span className="text-xs">
          {participantsLabel(competition.participantCount)} · {deadlineLabel(competition, now)}
        </span>
      </div>
    </Link>
  );
};
