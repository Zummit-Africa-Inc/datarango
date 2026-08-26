"use client";

import { useRef, useState } from "react";
import { useParams } from "next/navigation";
import { ArrowLeft, CalendarClock, Clock, Database, Trophy, Upload } from "lucide-react";
import Link from "next/link";

import { ApiError } from "@datarango/api";
import { Badge, Button, PageLayout, Skeleton } from "@datarango/ui";

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
  type SubmissionStatus,
} from "@/hooks/arena";

const submissionBadge = (status: SubmissionStatus) => {
  switch (status) {
    case "pendingScoring":
      return <Badge variant="outline">Waiting on scoring</Badge>;
    case "scored":
      return <Badge variant="success">Scored</Badge>;
    case "failed":
      return <Badge variant="destructive">Refused</Badge>;
    default:
      return <Badge variant="outline">Uploading</Badge>;
  }
};

export default function CompetitionDetailPage() {
  const competitionId = useParams().id as string;

  const { data: detail, isLoading } = useCompetition(competitionId);
  const competition = detail?.competition;
  const joined = detail?.joined ?? false;
  const isOpen = competition?.status === "open";

  const { data: leaderboard } = useLeaderboard(competitionId, isOpen);
  const { data: mine } = useMySubmissions(competitionId, joined);

  const join = useJoinCompetition(competitionId);
  const ticket = useCreateSubmissionUpload(competitionId);
  const complete = useCompleteSubmission(competitionId);

  const fileInput = useRef<HTMLInputElement>(null);
  const [file, setFile] = useState<File | null>(null);
  const [sending, setSending] = useState(false);
  // Inline rather than a toast: the message sits beside the control it
  // explains, and gateway failures keep their own hook-level toasts.
  const [uploadError, setUploadError] = useState<string | null>(null);

  if (isLoading) {
    return (
      <PageLayout title="Competition" subtitle="Loading…">
        <Skeleton skeleton="page" />
      </PageLayout>
    );
  }

  if (!competition) {
    return (
      <PageLayout title="Competition not found" subtitle="It may have closed or be org-private.">
        <Button asChild variant="outline">
          <Link href="/dashboard/competitions">Back to competitions</Link>
        </Button>
      </PageLayout>
    );
  }

  const todayCount = mine?.todayCount ?? 0;
  const atDayCap = todayCount >= competition.maxSubmissionsPerDay;

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

  const direction = METRIC_HIGHER_IS_BETTER[competition.metric]
    ? "higher is better"
    : "lower is better";

  return (
    <PageLayout
      title={competition.title}
      subtitle={competition.summary || "No summary yet."}
      actions={[
        isOpen && !joined && (
          <Button key="join" disabled={join.isPending} onClick={() => join.mutate()}>
            {join.isPending ? "Joining…" : "Join competition"}
          </Button>
        ),
        joined && (
          <Badge key="joined" variant="success">
            Joined
          </Badge>
        ),
        !isOpen && (
          <Badge key="closed" variant="outline">
            Closed
          </Badge>
        ),
      ]}
    >
      <Link
        href="/dashboard/competitions"
        className="text-muted-foreground hover:text-ink inline-flex items-center gap-1 text-sm transition-colors"
      >
        <ArrowLeft className="size-3.5" />
        All competitions
      </Link>

      <div className="border-hairline bg-card grid gap-4 rounded-xs border p-4 sm:grid-cols-2 lg:grid-cols-4">
        <div>
          <p className="text-muted-foreground text-xs font-medium tracking-wide uppercase">
            Metric
          </p>
          <p className="font-heading text-ink mt-1">
            {METRIC_LABELS[competition.metric]}
            <span className="text-muted-foreground ml-2 text-xs normal-case">{direction}</span>
          </p>
        </div>
        <div>
          <p className="text-muted-foreground text-xs font-medium tracking-wide uppercase">
            Timeline
          </p>
          <p className="text-ink mt-1 inline-flex items-center gap-1.5 text-sm">
            <CalendarClock className="size-3.5" />
            {competition.endsAt
              ? `ends ${new Date(competition.endsAt).toLocaleString()}`
              : "no end set"}
          </p>
        </div>
        <div>
          <p className="text-muted-foreground text-xs font-medium tracking-wide uppercase">
            Daily limit
          </p>
          <p className="text-ink mt-1 text-sm">
            {competition.maxSubmissionsPerDay} submission
            {competition.maxSubmissionsPerDay === 1 ? "" : "s"} per day
          </p>
        </div>
        <div>
          <p className="text-muted-foreground text-xs font-medium tracking-wide uppercase">
            Rewards
          </p>
          <p className="text-ink mt-1 text-sm">
            {competition.tokenRewardTotal > 0 ? (
              <>
                {competition.tokenRewardTotal} tokens · top {competition.tokenRewardPlacements}
              </>
            ) : (
              "Bragging rights"
            )}
          </p>
        </div>
      </div>

      <Button asChild variant="outline" size="sm" className="self-start">
        <Link href={`/dashboard/datasets/${competition.datasetId}`}>
          <Database className="size-3.5" />
          View the dataset
        </Link>
      </Button>

      {/* ── Leaderboard ─────────────────────────────────────────────────── */}

      <section className="space-y-3">
        <div className="flex items-baseline justify-between">
          <h2 className="font-heading text-ink inline-flex items-center gap-2 text-lg">
            <Trophy className="size-4" />
            Leaderboard
          </h2>
          <span className="text-muted-foreground text-sm">
            {leaderboard?.participantCount ?? 0} participant
            {(leaderboard?.participantCount ?? 0) === 1 ? "" : "s"}
          </span>
        </div>
        {!leaderboard || leaderboard.entries.length === 0 ? (
          <div className="border-hairline bg-card rounded-xs border px-6 py-10 text-center">
            <p className="text-ink font-medium">No scores yet</p>
            <p className="text-muted-foreground mt-1 text-sm">
              Standings appear once submissions have been scored.
            </p>
          </div>
        ) : (
          <div className="border-hairline bg-card overflow-hidden rounded-xs border">
            <table className="w-full text-sm">
              <thead>
                <tr className="bg-muted/50 text-muted-foreground border-hairline border-b text-left">
                  <th className="px-4 py-2.5 font-medium">#</th>
                  <th className="px-4 py-2.5 font-medium">Participant</th>
                  <th className="px-4 py-2.5 text-right font-medium">
                    Best {METRIC_LABELS[competition.metric]}
                  </th>
                </tr>
              </thead>
              <tbody>
                {leaderboard.entries.map((entry, index) => (
                  <tr key={entry.submissionId} className="border-hairline border-b last:border-b-0">
                    <td className="px-4 py-3 font-medium">{index + 1}</td>
                    <td className="text-ink px-4 py-3">{entry.displayName}</td>
                    <td className="px-4 py-3 text-right font-mono">{entry.score}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </section>

      {/* ── Your submissions ────────────────────────────────────────────── */}

      {joined && (
        <section className="space-y-3">
          <h2 className="font-heading text-ink text-lg">Your submissions</h2>

          <div className="border-hairline bg-card rounded-xs border p-4">
            {isOpen ? (
              atDayCap ? (
                <p className="text-muted-foreground text-sm">
                  You&apos;ve used all {competition.maxSubmissionsPerDay} submissions for today
                  (UTC). The count resets at midnight UTC.
                </p>
              ) : (
                <div className="flex flex-wrap items-center gap-3">
                  <input
                    ref={fileInput}
                    type="file"
                    accept=".csv,text/csv"
                    aria-label="Choose a predictions CSV"
                    className="text-sm"
                    disabled={sending}
                    onChange={(e) => setFile(e.target.files?.[0] ?? null)}
                  />
                  <Button size="sm" disabled={sending || !file} onClick={() => void submitFile()}>
                    <Upload className="size-3.5" />
                    {sending ? "Uploading…" : "Submit predictions"}
                  </Button>
                  <span className="text-muted-foreground text-xs">
                    CSV only · max 20 MB · {todayCount}/{competition.maxSubmissionsPerDay} used
                    today
                  </span>
                </div>
              )
            ) : (
              <p className="text-muted-foreground text-sm">
                This competition is not accepting submissions.
              </p>
            )}
            {uploadError && (
              <p role="alert" className="mt-2 text-sm text-red-500">
                {uploadError}
              </p>
            )}
            <p className="text-muted-foreground mt-2 flex items-center gap-1 text-xs">
              <Clock className="size-3" />
              Scores appear when the host&apos;s scoring run finishes — submitted work keeps its
              place in the queue.
            </p>
          </div>

          {!mine || mine.submissions.length === 0 ? (
            <div className="border-hairline bg-card rounded-xs border px-6 py-8 text-center">
              <p className="text-muted-foreground text-sm">No submissions yet.</p>
            </div>
          ) : (
            <ul className="divide-border divide-y">
              {mine.submissions.map((submission) => (
                <li
                  key={submission.id}
                  className="flex flex-wrap items-center justify-between gap-2 py-2.5 text-sm"
                >
                  <span className="text-ink">{submission.fileName}</span>
                  <span className="flex items-center gap-3">
                    {submission.status === "scored" && submission.score !== null && (
                      <span className="font-mono">{submission.score}</span>
                    )}
                    {submission.submittedAt && (
                      <span className="text-muted-foreground text-xs">
                        {new Date(submission.submittedAt).toLocaleString()}
                      </span>
                    )}
                    {submissionBadge(submission.status)}
                  </span>
                </li>
              ))}
            </ul>
          )}
        </section>
      )}

      {!joined && (
        <section className="border-hairline bg-card rounded-xs border p-6 text-center">
          <p className="text-ink font-medium">
            {isOpen
              ? "Join to submit and appear on the leaderboard"
              : "You didn't take part in this one"}
          </p>
          <p className="text-muted-foreground mt-1 text-sm">
            {isOpen
              ? "Joining is free — you can browse the dataset before deciding."
              : "Closed competitions keep their final standings on display."}
          </p>
        </section>
      )}
    </PageLayout>
  );
}
