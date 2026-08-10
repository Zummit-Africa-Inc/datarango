"use client";

import { useMemo, useState } from "react";
import { useParams } from "next/navigation";
import Link from "next/link";
import { ArrowLeft, CheckCircle2, XCircle } from "lucide-react";

import { useActiveOrg, usePermission } from "@datarango/auth";
import { Badge, Button, PageLayout, Skeleton } from "@datarango/ui";

import { GradingAnswerRow } from "@/components/grading-answer";
import { memberLabel, useOrgMembers } from "@/hooks/orgs";
import { useOrgGradeAnswer, useOrgGradingAttempt, type GradeAnswerResult } from "@/hooks/grading";

/**
 * One member's submission, opened for marking.
 *
 * No answer key on this screen and none sent by the server: the quiz may belong
 * to a creator this organization has nothing to do with, and marking a written
 * answer means reading it on its merits.
 */
export default function GradeAttemptPage() {
  const params = useParams<{ attemptId: string }>();
  const attemptId = params.attemptId;

  const { activeOrgId } = useActiveOrg();
  const canGrade = usePermission("org.grading.grade");
  const canViewMembers = usePermission("org.members.view");

  const { data: attempt, isLoading } = useOrgGradingAttempt(
    canGrade ? activeOrgId : null,
    attemptId,
  );
  const { data: members } = useOrgMembers(canViewMembers ? activeOrgId : null);
  const grade = useOrgGradeAnswer(activeOrgId, attemptId);

  // Held locally so the outcome survives the refetch that drops this attempt
  // out of the queue.
  const [outcome, setOutcome] = useState<GradeAnswerResult | null>(null);

  const learner = useMemo(
    () => (members ?? []).find((m) => m.userId === attempt?.userId),
    [members, attempt],
  );

  if (!canGrade) {
    return (
      <PageLayout title="Grading">
        <div className="border-hairline bg-muted/40 rounded-xs border px-4 py-3 text-sm">
          <p className="text-ink font-medium">You don&apos;t have access to grading</p>
          <p className="text-muted-foreground mt-1">
            Marking submissions needs the <code className="font-mono">org.grading.grade</code>{" "}
            permission.
          </p>
        </div>
      </PageLayout>
    );
  }

  if (isLoading) {
    return (
      <PageLayout title="Grading">
        <Skeleton skeleton="list" count={4} />
      </PageLayout>
    );
  }

  if (!attempt) {
    return (
      <PageLayout title="Grading">
        <div className="border-hairline bg-card rounded-xs border px-6 py-16 text-center">
          <p className="font-heading text-ink text-lg">Not yours to mark</p>
          <p className="text-muted-foreground mx-auto mt-1 max-w-md text-sm">
            This submission either doesn&apos;t exist, or it isn&apos;t on a course this
            organization assigned to that member.
          </p>
          <Button asChild variant="outline" className="mt-4">
            <Link href="/grading">Back to the queue</Link>
          </Button>
        </div>
      </PageLayout>
    );
  }

  const outstanding = attempt.answers.filter((a) => a.needsManualGrading && !a.graded).length;
  const who = learner ? memberLabel(learner) : `${attempt.userId.slice(0, 8)}…`;

  return (
    <PageLayout
      title={attempt.quizTitle}
      subtitle={`${who} · submitted ${new Date(attempt.submittedAt).toLocaleString()}`}
    >
      <Button asChild size="sm" variant="ghost" className="self-start">
        <Link href="/grading">
          <ArrowLeft className="size-4" />
          Grading queue
        </Link>
      </Button>

      {outcome?.finalised ? (
        <div
          className={`border-hairline bg-card flex items-start gap-3 rounded-xs border p-5 ${
            outcome.passed ? "border-emerald-600/40" : "border-amber-600/40"
          }`}
        >
          {outcome.passed ? (
            <CheckCircle2 className="mt-0.5 size-5 shrink-0 text-emerald-600" />
          ) : (
            <XCircle className="mt-0.5 size-5 shrink-0 text-amber-600" />
          )}
          <div>
            <p className="font-heading text-ink text-lg">
              Marked — {outcome.passed ? "passed" : "did not pass"} at {outcome.scorePercent}%
            </p>
            <p className="text-muted-foreground mt-1 text-sm">
              {/*
                "Will update", not "has updated": this request cannot write the
                learner's progress rows, so a consumer applies it moments later.
                Claiming their module is complete would be a promise this screen
                can't keep.
              */}
              {outcome.courseProgressQueued
                ? "Their course progress will update shortly."
                : "This wasn't taken inside a course, so it doesn't change any course progress."}
            </p>
          </div>
        </div>
      ) : (
        <div className="border-hairline bg-card flex flex-wrap items-center gap-3 rounded-xs border px-4 py-3">
          <Badge variant="outline">
            {outstanding} answer{outstanding === 1 ? "" : "s"} left to mark
          </Badge>
          <p className="text-muted-foreground text-sm">
            {/*
              The running score is only what the auto-graded questions already
              earned. Saying so stops an instructor reading it as a verdict they
              are about to rubber-stamp.
            */}
            {attempt.pointsAwarded} of {attempt.pointsAvailable} points decided so far ·{" "}
            {attempt.passThresholdPercent}% needed to pass
          </p>
        </div>
      )}

      <ul className="space-y-2">
        {attempt.answers.map((answer, index) => (
          <GradingAnswerRow
            key={answer.answerId}
            answer={answer}
            index={index}
            pending={grade.isPending}
            disabled={outcome?.finalised ?? false}
            onGrade={(points, feedback) =>
              grade.mutate(
                {
                  answerId: answer.answerId,
                  pointsAwarded: points,
                  feedback: feedback || undefined,
                },
                { onSuccess: setOutcome },
              )
            }
          />
        ))}
      </ul>
    </PageLayout>
  );
}
