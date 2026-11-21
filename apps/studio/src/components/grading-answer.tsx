"use client";

import { CheckCircle2, Clock, XCircle } from "lucide-react";
import { useState } from "react";

import { Badge, Button, Input, Textarea, cn } from "@datarango/ui";
import type { GradingAnswer } from "@/hooks/grading";

/**
 * One answer on the grading screen.
 *
 * Auto-graded answers render read-only alongside the ones being marked, because
 * a grader judging a written answer wants to know how the rest of the attempt
 * went — and because it makes plain which questions the grader is and isn't
 * deciding.
 */
export const GradingAnswerRow = ({
  answer,
  index,
  onGrade,
  pending,
  disabled,
}: {
  answer: GradingAnswer;
  index: number;
  onGrade: (points: number, feedback: string) => void;
  pending: boolean;
  disabled: boolean;
}) => {
  const [points, setPoints] = useState(answer.pointsAwarded);
  const [feedback, setFeedback] = useState(answer.feedback ?? "");

  const outstanding = answer.needsManualGrading && !answer.graded;
  const response = answer.response.join(", ").trim();

  return (
    <li className="border-hairline bg-card rounded-xs border">
      <div className="flex items-start gap-3 px-4 py-3">
        <span className="text-muted-foreground w-6 shrink-0 pt-0.5 text-xs tabular-nums">
          {String(index + 1).padStart(2, "0")}
        </span>

        <div className="min-w-0 flex-1">
          <p className="text-ink text-sm font-medium">{answer.prompt}</p>

          <div className="mt-2">
            <p className="text-muted-foreground text-xs">Their answer</p>
            {response ? (
              <p
                className={cn(
                  "text-ink mt-1 text-sm whitespace-pre-wrap",
                  (answer.kind === "codeSnippet" || answer.kind === "notebook") &&
                    "bg-muted max-h-96 overflow-auto rounded-xs p-2 font-mono text-xs",
                )}
              >
                {response}
              </p>
            ) : (
              <p className="text-muted-foreground mt-1 text-sm italic">Left blank</p>
            )}
          </div>
          {answer.autoGradeReport && <TestReport json={answer.autoGradeReport} />}
        </div>

        <div className="shrink-0 text-right">
          {outstanding ? (
            <Badge variant="outline">
              <Clock className="size-3" />
              To mark
            </Badge>
          ) : answer.needsManualGrading ? (
            <Badge variant="ghost">Marked</Badge>
          ) : answer.pointsAwarded === answer.pointsAvailable ? (
            <Badge variant="success">
              <CheckCircle2 className="size-3" />
              Auto
            </Badge>
          ) : (
            <Badge variant="ghost">
              <XCircle className="size-3" />
              Auto
            </Badge>
          )}
          <p className="text-muted-foreground mt-1 text-xs tabular-nums">
            {outstanding ? "—" : answer.pointsAwarded}/{answer.pointsAvailable}
          </p>
        </div>
      </div>

      {outstanding && (
        <form
          className="border-hairline space-y-2 border-t px-4 py-3"
          onSubmit={(e) => {
            e.preventDefault();
            onGrade(points, feedback);
          }}
        >
          <div className="flex flex-wrap items-end gap-3">
            <div className="w-28 space-y-1.5">
              <label className="text-xs font-medium" htmlFor={`points-${answer.answerId}`}>
                Points
              </label>
              <Input
                id={`points-${answer.answerId}`}
                type="number"
                min={0}
                max={answer.pointsAvailable}
                value={points}
                onChange={(e) =>
                  // Clamped here as well as on the server: an out-of-range value
                  // is refused with assessment.invalid_points, and finding that
                  // out after typing is a worse experience than not being able
                  // to type it.
                  setPoints(
                    Math.max(0, Math.min(answer.pointsAvailable, Number(e.target.value) || 0)),
                  )
                }
              />
            </div>
            <p className="text-muted-foreground pb-2 text-xs">out of {answer.pointsAvailable}</p>
          </div>

          <div className="space-y-1.5">
            <label className="text-xs font-medium" htmlFor={`feedback-${answer.answerId}`}>
              Feedback <span className="text-muted-foreground font-normal">(optional)</span>
            </label>
            <Textarea
              id={`feedback-${answer.answerId}`}
              rows={2}
              value={feedback}
              onChange={(e) => setFeedback(e.target.value)}
              placeholder="What was good, what was missing…"
            />
            <p className="text-muted-foreground text-xs">
              The learner sees this. A bare score explains nothing — it&apos;s the reason marking
              this by hand is worth the wait.
            </p>
          </div>

          <Button type="submit" size="sm" disabled={pending || disabled}>
            {pending ? "Saving…" : "Record mark"}
          </Button>
        </form>
      )}

      {answer.needsManualGrading && answer.graded && answer.feedback && (
        <p className="border-hairline text-muted-foreground border-t px-4 py-2 text-xs">
          Your feedback: {answer.feedback}
        </p>
      )}
    </li>
  );
};

type Report =
  | {
      passed: number;
      total: number;
      tests?: { name: string; passed: boolean; message: string | null }[];
    }
  | { error: string };

/** The notebook test run, so a reviewer marks the code knowing what passed. */
const TestReport = ({ json }: { json: string }) => {
  let report: Report;
  try {
    report = JSON.parse(json) as Report;
  } catch {
    return null;
  }
  return (
    <div className="mt-3">
      <p className="text-muted-foreground text-xs">Tests</p>
      {"error" in report ? (
        <pre className="bg-destructive/5 text-ink mt-1 overflow-x-auto rounded-xs px-2 py-1.5 text-xs whitespace-pre-wrap">
          {report.error}
        </pre>
      ) : (
        <>
          <p className="text-ink mt-1 text-sm">
            {report.passed} of {report.total} passed
          </p>
          <ul className="mt-1 space-y-0.5">
            {report.tests?.map((test) => (
              <li key={test.name} className="flex items-start gap-2 text-xs">
                {test.passed ? (
                  <CheckCircle2 className="mt-0.5 size-3.5 shrink-0 text-emerald-600" />
                ) : (
                  <XCircle className="mt-0.5 size-3.5 shrink-0 text-amber-600" />
                )}
                <span className="min-w-0">
                  <code className="text-ink">{test.name}</code>
                  {!test.passed && test.message && (
                    <span className="text-muted-foreground block wrap-break-word">
                      {test.message}
                    </span>
                  )}
                </span>
              </li>
            ))}
          </ul>
        </>
      )}
    </div>
  );
};
