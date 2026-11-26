"use client";

import { useRef, useState } from "react";
import { useParams } from "next/navigation";
import {
  ArrowLeft,
  CalendarClock,
  Clock,
  Database,
  FileUp,
  Gauge,
  Medal,
  Trophy,
  Users,
} from "lucide-react";
import Link from "next/link";

import { ApiError } from "@datarango/api";
import { useUser } from "@datarango/auth";
import {
  Badge,
  Button,
  CatalogueCover,
  cn,
  EmptyState,
  ProgressBar,
  PropertyList,
  Skeleton,
  Tabs,
  TabsContent,
  TabsList,
  TabsTrigger,
  UserAvatar,
} from "@datarango/ui";

import {
  competitionPhase,
  deadlineLabel,
  formatDuration,
  PhaseBadge,
  PrizeLabel,
  useNow,
} from "@/components/competitions/competition-meta";
import {
  METRIC_HIGHER_IS_BETTER,
  METRIC_LABELS,
  SUBMISSION_MAX_BYTES,
  useCompetition,
  useCompleteSubmission,
  useCreateSubmissionUpload,
  useJoinCompetition,
  useLeaderboard,
  useMySubmissions,
  putSubmissionToTicket,
  type Competition,
  type Leaderboard,
  type LeaderboardEntry,
  type MySubmissions,
  type SubmissionStatus,
} from "@/hooks/arena";

const dateTime = new Intl.DateTimeFormat(undefined, {
  day: "numeric",
  month: "short",
  hour: "2-digit",
  minute: "2-digit",
});

const MEDALS = ["text-amber-solid", "text-foreground-muted", "text-rose-solid"];

/** One board's standings. Rank comes from the API, so ties share a place. */
function StandingsTable({
  entries,
  scoreLabel,
  meId,
}: {
  entries: LeaderboardEntry[];
  scoreLabel: string;
  meId?: string;
}) {
  return (
    <table className="w-full text-sm">
      <thead>
        <tr className="text-foreground-muted border-border border-b text-left text-xs">
          <th className="w-16 px-4 py-2.5 font-medium">Rank</th>
          <th className="px-4 py-2.5 font-medium">Participant</th>
          <th className="px-4 py-2.5 text-right font-medium">{scoreLabel}</th>
        </tr>
      </thead>
      <tbody>
        {entries.map((entry) => {
          const me = entry.userId === meId;
          return (
            <tr
              key={entry.submissionId}
              aria-current={me ? "true" : undefined}
              className={cn("border-border border-b last:border-b-0", me && "bg-primary-soft/60")}
            >
              <td className="px-4 py-3">
                <span className="inline-flex items-center gap-1.5 font-mono font-medium">
                  {entry.rank <= 3 && (
                    <Medal aria-hidden className={cn("size-4", MEDALS[entry.rank - 1])} />
                  )}
                  {entry.rank}
                </span>
              </td>
              <td className="px-4 py-3">
                <span className="flex items-center gap-2.5">
                  <UserAvatar className="size-7" name={entry.displayName} />
                  <span className="text-foreground truncate">{entry.displayName}</span>
                  {me && (
                    <Badge appearance="soft" tone="primary">
                      You
                    </Badge>
                  )}
                </span>
              </td>
              <td className="px-4 py-3 text-right font-mono">{entry.score}</td>
            </tr>
          );
        })}
      </tbody>
    </table>
  );
}

const submissionBadge = (status: SubmissionStatus) => {
  switch (status) {
    case "pendingScoring":
      return <Badge appearance="outline">Waiting on scoring</Badge>;
    case "scored":
      return <Badge tone="success">Scored</Badge>;
    case "failed":
      return <Badge tone="danger">Refused</Badge>;
    default:
      return <Badge appearance="outline">Uploading</Badge>;
  }
};

export default function CompetitionDetailPage() {
  const competitionId = useParams().id as string;
  const now = useNow();
  const user = useUser();

  const { data: detail, isLoading } = useCompetition(competitionId);
  const competition = detail?.competition;
  const joined = detail?.joined ?? false;
  const isOpen = competition?.status === "open";

  const { data: leaderboard } = useLeaderboard(competitionId, isOpen);
  const { data: mine } = useMySubmissions(competitionId, joined);

  if (isLoading) return <Skeleton skeleton="page" />;

  if (!competition) {
    return (
      <EmptyState
        action={
          <Button asChild variant="secondary">
            <Link href="/dashboard/competitions">Back to competitions</Link>
          </Button>
        }
        hint="It may have been removed, or it's private to an organisation you're not viewing as."
        icon={Trophy}
        title="Competition not found"
      />
    );
  }

  const phase = competitionPhase(competition, now);
  const participants = leaderboard?.participantCount ?? 0;
  const direction = METRIC_HIGHER_IS_BETTER[competition.metric]
    ? "higher is better"
    : "lower is better";

  const meta = [
    { icon: CalendarClock, label: deadlineLabel(competition, now) },
    {
      icon: Users,
      label: `${participants.toLocaleString()} ${participants === 1 ? "participant" : "participants"}`,
    },
    { icon: Gauge, label: `${METRIC_LABELS[competition.metric]} · ${direction}` },
  ];

  return (
    <div className="space-y-8">
      <Link
        className="text-foreground-muted hover:text-foreground inline-flex items-center gap-1.5 text-sm transition-colors"
        href="/dashboard/competitions"
      >
        <ArrowLeft className="size-4" />
        All competitions
      </Link>

      <header>
        <CatalogueCover icon={Trophy} iconTile id={competition.id} title={competition.title} />
        <div className="max-w-3xl">
          <div className="mt-2 mb-2 flex flex-wrap items-center gap-2">
            <PhaseBadge phase={phase} />
            {competition.orgId && (
              <Badge appearance="outline" tone="neutral">
                Your organisation only
              </Badge>
            )}
          </div>
          <h1 className="font-display text-foreground text-3xl leading-tight font-semibold tracking-tight">
            {competition.title}
          </h1>
          {competition.summary && (
            <p className="text-foreground-muted mt-2 text-base">{competition.summary}</p>
          )}
          <ul className="text-foreground-muted mt-4 flex flex-wrap gap-x-5 gap-y-2 text-sm">
            {meta.map(({ icon: Icon, label }) => (
              <li className="flex items-center gap-1.5" key={label}>
                <Icon aria-hidden className="size-4" />
                {label}
              </li>
            ))}
            <li>
              <PrizeLabel competition={competition} />
            </li>
          </ul>
        </div>
      </header>

      <div className="grid gap-8 lg:grid-cols-[minmax(0,1fr)_20rem]">
        <Tabs className="min-w-0" defaultValue="leaderboard">
          <TabsList>
            <TabsTrigger value="leaderboard">Leaderboard</TabsTrigger>
            <TabsTrigger value="submissions">
              Your submissions
              {mine && mine.submissions.length > 0 && (
                <span className="text-foreground-muted ml-1.5 font-mono text-xs">
                  {mine.submissions.length}
                </span>
              )}
            </TabsTrigger>
            <TabsTrigger value="rules">Rules</TabsTrigger>
          </TabsList>
          <TabsContent className="pt-5" value="leaderboard">
            <LeaderboardPanel competition={competition} leaderboard={leaderboard} meId={user?.id} />
          </TabsContent>
          <TabsContent className="pt-5" value="submissions">
            <SubmissionsPanel joined={joined} mine={mine} open={isOpen} />
          </TabsContent>
          <TabsContent className="pt-5" value="rules">
            <RulesPanel competition={competition} />
          </TabsContent>
        </Tabs>

        <aside className="space-y-4 lg:sticky lg:top-6 lg:self-start">
          <ActionCard competition={competition} joined={joined} mine={mine} now={now} />
          <Button asChild className="w-full" variant="secondary">
            <Link href={`/dashboard/datasets/${competition.datasetId}`}>
              <Database className="size-4" />
              View the dataset
            </Link>
          </Button>
        </aside>
      </div>
    </div>
  );
}

const LeaderboardPanel = ({
  competition,
  leaderboard,
  meId,
}: {
  competition: Competition;
  leaderboard?: Leaderboard;
  meId?: string;
}) => {
  // A closed competition with a hidden split ranks on the private rows.
  const finalBoard = leaderboard?.board === "private";
  const metric = METRIC_LABELS[competition.metric];

  return (
    <section className="space-y-3">
      <h2 className="font-display text-foreground text-lg font-semibold">
        {finalBoard ? "Final standings (private)" : "Leaderboard"}
      </h2>
      {finalBoard ? (
        <p className="text-foreground-muted text-sm">
          Ranked on the hidden {100 - competition.publicSharePercent}% of the test rows, using each
          participant&apos;s best submission on the public board.
        </p>
      ) : (
        competition.publicSharePercent < 100 && (
          <p className="text-foreground-muted text-sm">
            Scored on {competition.publicSharePercent}% of the test rows. The final ranking uses the
            other {100 - competition.publicSharePercent}%, revealed when the competition closes.
          </p>
        )
      )}
      {!leaderboard || leaderboard.entries.length === 0 ? (
        <EmptyState
          hint="Standings appear once submissions have been scored."
          icon={Trophy}
          title="No scores yet"
        />
      ) : (
        <div className="border-border bg-card overflow-hidden rounded-lg border">
          <StandingsTable
            entries={leaderboard.entries}
            meId={meId}
            scoreLabel={`${finalBoard ? "Private" : "Best"} ${metric}`}
          />
        </div>
      )}
      {finalBoard && leaderboard?.publicEntries && leaderboard.publicEntries.length > 0 && (
        <details className="border-border bg-card rounded-lg border">
          <summary className="text-foreground-muted cursor-pointer px-4 py-2.5 text-sm">
            Public leaderboard at close
          </summary>
          <StandingsTable
            entries={leaderboard.publicEntries}
            meId={meId}
            scoreLabel={`Public ${metric}`}
          />
        </details>
      )}
    </section>
  );
};

const SubmissionsPanel = ({
  joined,
  mine,
  open,
}: {
  joined: boolean;
  mine?: MySubmissions;
  open: boolean;
}) => {
  if (!joined) {
    return (
      <EmptyState
        hint={
          open
            ? "Join the competition to submit predictions and appear on the leaderboard."
            : "You didn't take part in this one."
        }
        icon={FileUp}
        title="No submissions"
      />
    );
  }
  if (!mine || mine.submissions.length === 0) {
    return (
      <EmptyState
        hint="Upload a predictions CSV from the panel on the right."
        icon={FileUp}
        title="No submissions yet"
      />
    );
  }
  return (
    <ul className="border-border bg-card divide-border divide-y overflow-hidden rounded-lg border">
      {mine.submissions.map((submission) => (
        <li
          className="flex flex-wrap items-center justify-between gap-2 px-4 py-3 text-sm"
          key={submission.id}
        >
          <span className="min-w-0">
            <span className="text-foreground block truncate">{submission.fileName}</span>
            {submission.submittedAt && (
              <span className="text-foreground-muted text-xs">
                {dateTime.format(new Date(submission.submittedAt))}
              </span>
            )}
          </span>
          <span className="flex items-center gap-3">
            {submission.status === "scored" && submission.score !== null && (
              <span className="font-mono">
                {submission.privateScore !== null &&
                submission.privateScore !== submission.score ? (
                  <>
                    <span className="text-foreground-muted text-xs">public </span>
                    {submission.score}
                    <span className="text-foreground-muted text-xs"> · private </span>
                    {submission.privateScore}
                  </>
                ) : (
                  submission.score
                )}
              </span>
            )}
            {submissionBadge(submission.status)}
          </span>
        </li>
      ))}
    </ul>
  );
};

const RulesPanel = ({ competition }: { competition: Competition }) => {
  const higher = METRIC_HIGHER_IS_BETTER[competition.metric];
  const perDay = competition.maxSubmissionsPerDay;
  return (
    <div className="space-y-6">
      <PropertyList
        items={[
          {
            label: "Metric",
            value: `${METRIC_LABELS[competition.metric]} (${higher ? "higher" : "lower"} is better)`,
          },
          {
            label: "Submissions",
            value: `${perDay} per day, reset at midnight UTC. CSV files up to 20 MB.`,
          },
          {
            label: "Leaderboard",
            value:
              competition.publicSharePercent < 100
                ? `Live board scores ${competition.publicSharePercent}% of the test rows; the final ranking uses the other ${100 - competition.publicSharePercent}%.`
                : "Scored on all test rows.",
          },
          {
            label: "Opens",
            value: competition.startsAt
              ? dateTime.format(new Date(competition.startsAt))
              : "Open now",
          },
          {
            label: "Closes",
            value: competition.endsAt
              ? dateTime.format(new Date(competition.endsAt))
              : "No end date",
          },
          {
            label: "Rewards",
            value:
              competition.tokenRewardTotal > 0
                ? `${competition.tokenRewardTotal.toLocaleString()} tokens shared by the top ${competition.tokenRewardPlacements}`
                : "Kudos only",
          },
          {
            label: "Who can enter",
            value: competition.orgId ? "Members of the hosting organisation" : "Everyone",
          },
        ]}
      />
      <p className="text-foreground-muted text-sm">
        Ties go to whoever submitted first. Your best public score picks the submission that counts
        for the final ranking.
      </p>
    </div>
  );
};

/** Rail: what you can do now, the clock, and the prize. */
const ActionCard = ({
  competition,
  joined,
  mine,
  now,
}: {
  competition: Competition;
  joined: boolean;
  mine?: MySubmissions;
  now: number;
}) => {
  const phase = competitionPhase(competition, now);
  const isOpen = competition.status === "open";
  const join = useJoinCompetition(competition.id);
  const ticket = useCreateSubmissionUpload(competition.id);
  const complete = useCompleteSubmission(competition.id);

  const fileInput = useRef<HTMLInputElement>(null);
  const [file, setFile] = useState<File | null>(null);
  const [sending, setSending] = useState(false);
  // Inline rather than a toast: the message sits beside the control it
  // explains, and gateway failures keep their own hook-level toasts.
  const [uploadError, setUploadError] = useState<string | null>(null);

  const todayCount = mine?.todayCount ?? 0;
  const perDay = competition.maxSubmissionsPerDay;
  const atDayCap = todayCount >= perDay;

  const submitFile = async () => {
    if (!file) return;
    // Client-side mirrors of the server's rules — the server re-checks all of
    // it, but a 30MB PDF should never leave the browser.
    if (file.size <= 0 || file.size > SUBMISSION_MAX_BYTES) {
      setUploadError("Submissions are CSV files up to 20 MB.");
      return;
    }
    setSending(true);
    setUploadError(null);
    try {
      const t = await ticket.mutateAsync({
        fileName: file.name,
        contentType: "text/csv",
        sizeBytes: file.size,
      });
      await putSubmissionToTicket(t, file);
      await complete.mutateAsync({ submissionId: t.submissionId });
    } catch (error) {
      // Gateway failures already toasted from their hooks (ApiError); the
      // storage hop is the one failure only this layer can name.
      if (!(error instanceof ApiError)) {
        setUploadError(error instanceof Error ? error.message : "Submission failed — try again.");
      }
    } finally {
      setSending(false);
      setFile(null);
      if (fileInput.current) fileInput.current.value = "";
    }
  };

  const clockTarget =
    phase === "upcoming" ? competition.startsAt : phase === "live" ? competition.endsAt : null;

  return (
    <div className="border-border bg-card space-y-5 rounded-lg border p-5">
      <div>
        <p className="text-foreground-muted text-xs">
          {phase === "upcoming" ? "Opens in" : phase === "live" ? "Time left" : "Status"}
        </p>
        <p className="text-foreground mt-1 font-mono text-2xl font-bold">
          {clockTarget
            ? formatDuration(new Date(clockTarget).getTime() - now)
            : phase === "live"
              ? "No end date"
              : "Closed"}
        </p>
      </div>

      <div className="border-border border-t pt-4">
        <p className="text-foreground-muted text-xs">Prize</p>
        <p className="text-foreground mt-1 text-sm font-medium">
          {competition.tokenRewardTotal > 0 ? (
            <>
              <span className="font-mono">{competition.tokenRewardTotal.toLocaleString()}</span>{" "}
              tokens · top {competition.tokenRewardPlacements}
            </>
          ) : (
            "Kudos"
          )}
        </p>
      </div>

      <div className="border-border space-y-3 border-t pt-4">
        {!isOpen ? (
          <p className="text-foreground-muted text-sm">
            {joined
              ? "This competition has closed. Your final place is on the leaderboard."
              : "This competition has closed. The final standings stay on display."}
          </p>
        ) : !joined ? (
          <>
            <Button className="w-full" disabled={join.isPending} onClick={() => join.mutate()}>
              {join.isPending ? "Joining…" : "Join competition"}
            </Button>
            <p className="text-foreground-muted text-xs">
              Free to join. You can look at the dataset first.
            </p>
          </>
        ) : atDayCap ? (
          <p className="text-foreground-muted text-sm">
            You&apos;ve used all {perDay} submissions for today. The count resets at midnight UTC.
          </p>
        ) : (
          <>
            <label
              className={cn(
                "border-border-strong hover:bg-muted/60 flex cursor-pointer flex-col items-center gap-1.5 rounded-lg border border-dashed px-3 py-5 text-center text-sm transition-colors",
                sending && "pointer-events-none opacity-60",
              )}
            >
              <FileUp aria-hidden className="text-foreground-muted size-5" />
              <span className="text-foreground font-medium">
                {file ? file.name : "Choose a predictions CSV"}
              </span>
              <span className="text-foreground-muted text-xs">CSV · up to 20 MB</span>
              <input
                accept=".csv,text/csv"
                className="sr-only"
                disabled={sending}
                onChange={(e) => setFile(e.target.files?.[0] ?? null)}
                ref={fileInput}
                type="file"
              />
            </label>
            <Button
              className="w-full"
              disabled={sending || !file}
              onClick={() => void submitFile()}
            >
              {sending ? "Uploading…" : "Submit predictions"}
            </Button>
          </>
        )}
        {isOpen && joined && (
          <div className="space-y-1.5">
            <div className="text-foreground-muted flex justify-between text-xs">
              <span>Used today</span>
              <span className="font-mono">
                {todayCount}/{perDay}
              </span>
            </div>
            <ProgressBar value={Math.min(100, (todayCount / perDay) * 100)} />
          </div>
        )}
        {uploadError && (
          <p className="text-danger text-sm" role="alert">
            {uploadError}
          </p>
        )}
        {isOpen && joined && (
          <p className="text-foreground-muted flex items-start gap-1.5 text-xs">
            <Clock aria-hidden className="mt-0.5 size-3 shrink-0" />
            Scores appear when the scoring run finishes. Submitted work keeps its place in the
            queue.
          </p>
        )}
      </div>
    </div>
  );
};
