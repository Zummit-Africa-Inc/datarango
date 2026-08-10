"use client";

import { useState } from "react";
import { useParams } from "next/navigation";
import Link from "next/link";
import { ArrowLeft, CheckCircle2, XCircle } from "lucide-react";

import { Badge, Button, PageLayout, Skeleton } from "@datarango/ui";

import { GradingAnswerRow } from "@/components/grading-answer";
import { useGradeAnswer, useGradingAttempt, type GradeAnswerResult } from "@/hooks/grading";

/**
 * One attempt, opened for marking.
 *
 * There is deliberately no answer key on this screen — the server does not send
 * one. Marking a written answer means reading it on its merits, and for the org
 * instructor equivalent the quiz may belong to a creator they have nothing to
 * do with.
 */
export default function GradeAttemptPage() {
  const params = useParams<{ attemptId: string }>();
  const attemptId = params.attemptId;

  const { data: attempt, isLoading } = useGradingAttempt(attemptId);
  const grade = useGradeAnswer(attemptId);

  // Kept locally so the outcome stays on screen after the queries refetch and
  // the attempt drops out of the queue.
  const [outcome, setOutcome] = useState<GradeAnswerResult | null>(null);

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
            This submission either doesn&apos;t exist or isn&apos;t on one of your quizzes.
          </p>
          <Button asChild variant="outline" className="mt-4">
            <Link href="/grading">Back to the queue</Link>
          </Button>
        </div>
      </PageLayout>
    );
  }

  const outstanding = attempt.answers.filter((a) => a.needsManualGrading && !a.graded).length;

  return (
    <PageLayout
      title={attempt.quizTitle}
      subtitle={`Submitted ${new Date(attempt.submittedAt).toLocaleString()} · learner ${attempt.userId.slice(0, 8)}`}
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
                "Queued", not "updated": the mark is recorded, but the learner's
                course progress is applied by a consumer a moment later, because
                this request cannot write their rows. Claiming their module is
                complete would be a promise this screen can't keep.
              */}
              {outcome.courseProgressQueued
                ? "Their course progress will update shortly."
                : "This was a practice attempt, so it doesn't change any course progress."}
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
              The running score is the auto-graded floor. Saying so stops a
              grader reading "17%" as a verdict they are about to confirm.
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
                { answerId: answer.answerId, pointsAwarded: points, feedback: feedback || undefined },
                { onSuccess: setOutcome },
              )
            }
          />
        ))}
      </ul>
    </PageLayout>
  );
}
