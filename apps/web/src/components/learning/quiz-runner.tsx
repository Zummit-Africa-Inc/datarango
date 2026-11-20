"use client";

import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { useQueryClient } from "@tanstack/react-query";
import { AlertTriangle, CheckCircle2, Clock, Loader2, XCircle } from "lucide-react";

import { CodeEditor } from "@datarango/notebook";
import { Badge, Button, Input, Markdown, Textarea, cn } from "@datarango/ui";

import {
  useAttempt,
  useQuiz,
  useSubmitQuiz,
  type AttemptAnswerDetail,
  type AttemptContext,
  type AttemptResult,
  type AttemptStatus,
  type QuizQuestion,
  type QuizTakeView,
  type TestReport,
} from "@/hooks/assessment";

/**
 * The shared quiz runner — one component for all three attempt contexts
 * (standalone from the library, a quiz lesson, a module's end-of-module
 * exercise). The context only changes what the submission carries and what the
 * result screen can honestly claim afterwards.
 *
 * Answers autosave to localStorage as they're entered: a half-finished attempt
 * survives a reload or an accidental navigation, which matters most on a timed
 * quiz where restarting means losing the clock.
 */
export interface QuizRunnerProps {
  quizId: string;
  context: AttemptContext;
  courseId?: string;
  courseVersionId?: string;
  lessonId?: string;
  moduleId?: string;
  /** Fires after a submission so the host page can refresh progress. */
  onCompleted?: (result: AttemptResult) => void;
}

type Answers = Record<string, string[]>;

const draftKey = (quizId: string, context: AttemptContext, scopeId?: string) =>
  `dr:quiz-draft:${quizId}:${context}:${scopeId ?? "none"}`;

export const QuizRunner = ({
  quizId,
  context,
  courseId,
  courseVersionId,
  lessonId,
  moduleId,
  onCompleted,
}: QuizRunnerProps) => {
  const { data: quiz, isLoading } = useQuiz(quizId);
  const submit = useSubmitQuiz(quizId);

  const [answers, setAnswers] = useState<Answers>({});
  const [result, setResult] = useState<AttemptResult | null>(null);
  const storageKey = draftKey(quizId, context, lessonId ?? moduleId);

  // Restore a draft on mount. Guarded because a malformed or foreign value in
  // localStorage must not take the runner down.
  useEffect(() => {
    try {
      const saved = window.localStorage.getItem(storageKey);
      if (saved) setAnswers(JSON.parse(saved) as Answers);
    } catch {
      // Ignore — an unreadable draft just means starting fresh.
    }
  }, [storageKey]);

  useEffect(() => {
    if (result) return;
    try {
      window.localStorage.setItem(storageKey, JSON.stringify(answers));
    } catch {
      // Storage full or blocked; autosave is a convenience, not a requirement.
    }
  }, [answers, storageKey, result]);

  const setAnswer = useCallback((questionId: string, value: string[]) => {
    setAnswers((prev) => ({ ...prev, [questionId]: value }));
  }, []);

  const attemptsLeft = useMemo(() => {
    if (!quiz || quiz.maxAttempts === 0) return null;
    return Math.max(0, quiz.maxAttempts - quiz.attemptsUsed);
  }, [quiz]);

  const onSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    // A notebook question nobody typed into still submits what its editor
    // shows — the starter code — rather than nothing.
    const responses: Answers = { ...answers };
    for (const question of quiz?.questions ?? []) {
      if (question.kind === "notebook" && !responses[question.id]?.length) {
        responses[question.id] = [question.starterCode];
      }
    }
    submit.mutate(
      { context, courseId, courseVersionId, lessonId, moduleId, responses },
      {
        onSuccess: (attempt) => {
          setResult(attempt);
          // The attempt is graded and stored server-side now; keeping the draft
          // would repopulate a finished quiz on the next visit.
          try {
            window.localStorage.removeItem(storageKey);
          } catch {
            /* nothing to recover from */
          }
          onCompleted?.(attempt);
        },
      },
    );
  };

  if (isLoading) {
    return <p className="text-muted-foreground text-sm">Loading quiz…</p>;
  }

  if (!quiz) {
    return (
      <p className="text-muted-foreground border-hairline bg-card rounded-xs border px-4 py-8 text-center text-sm">
        This quiz isn&apos;t available. It may not be published yet.
      </p>
    );
  }

  if (result) {
    return <QuizResult quiz={quiz} result={result} context={context} />;
  }

  const exhausted = attemptsLeft === 0;

  return (
    <form onSubmit={onSubmit} className="space-y-6">
      <div className="border-hairline bg-card rounded-xs border p-4">
        <div className="flex flex-wrap items-center justify-between gap-2">
          <h2 className="font-heading text-ink text-lg">{quiz.title}</h2>
          <div className="flex items-center gap-2 text-xs">
            <Badge variant="outline">Pass at {quiz.passThresholdPercent}%</Badge>
            {attemptsLeft !== null && (
              <Badge variant={exhausted ? "destructive" : "ghost"}>
                {exhausted
                  ? "No attempts left"
                  : `${attemptsLeft} attempt${attemptsLeft === 1 ? "" : "s"} left`}
              </Badge>
            )}
          </div>
        </div>
        {quiz.description && (
          <p className="text-muted-foreground mt-2 text-sm leading-relaxed">{quiz.description}</p>
        )}
        {context === "standalone" && (
          <p className="text-muted-foreground mt-3 flex items-start gap-1.5 text-xs">
            <AlertTriangle className="mt-0.5 size-3.5 shrink-0" />
            {/* Being explicit here avoids a nasty surprise later. */}
            Taking this from the library won&apos;t count towards a course — take it inside the
            course for that.
          </p>
        )}
      </div>

      {quiz.questions.map((question, index) => (
        <QuestionField
          key={question.id}
          question={question}
          index={index}
          value={answers[question.id] ?? []}
          onChange={(value) => setAnswer(question.id, value)}
          disabled={exhausted}
        />
      ))}

      <div className="flex items-center justify-between">
        <p className="text-muted-foreground text-xs">
          Answers save as you go — you can come back to this.
        </p>
        <Button type="submit" disabled={submit.isPending || exhausted}>
          {submit.isPending ? "Submitting…" : "Submit answers"}
        </Button>
      </div>
    </form>
  );
};

/* -------------------------------- questions -------------------------------- */

const QuestionField = ({
  question,
  index,
  value,
  onChange,
  disabled,
}: {
  question: QuizQuestion;
  index: number;
  value: string[];
  onChange: (value: string[]) => void;
  disabled: boolean;
}) => (
  <fieldset className="border-hairline bg-card rounded-xs border p-4" disabled={disabled}>
    <legend className="sr-only">Question {index + 1}</legend>
    <div className="flex items-start gap-3">
      <span className="text-muted-foreground w-6 shrink-0 text-xs tabular-nums">
        {String(index + 1).padStart(2, "0")}
      </span>
      <div className="min-w-0 flex-1">
        {question.kind === "notebook" ? (
          // Exercise prompts are written like lesson text: code, lists, data.
          <Markdown className="text-ink text-sm">{question.prompt}</Markdown>
        ) : (
          <p className="text-ink text-sm font-medium">{question.prompt}</p>
        )}
        <p className="text-muted-foreground mt-0.5 text-xs">
          {question.points} point{question.points === 1 ? "" : "s"}
          {question.kind === "multiSelect" && " · select all that apply"}
        </p>

        <div className="mt-3 space-y-2">
          {question.kind === "mcq" &&
            question.options.map((option) => (
              <label className="flex items-center gap-2 text-sm" key={option.id}>
                <input
                  type="radio"
                  name={question.id}
                  checked={value[0] === option.id}
                  onChange={() => onChange([option.id])}
                />
                <span>{option.text}</span>
              </label>
            ))}

          {question.kind === "multiSelect" &&
            question.options.map((option) => (
              <label className="flex items-center gap-2 text-sm" key={option.id}>
                <input
                  type="checkbox"
                  checked={value.includes(option.id)}
                  onChange={(e) =>
                    onChange(
                      e.target.checked
                        ? [...value, option.id]
                        : value.filter((id) => id !== option.id),
                    )
                  }
                />
                <span>{option.text}</span>
              </label>
            ))}

          {question.kind === "shortAnswer" && (
            <Input
              aria-label={`Answer to question ${index + 1}`}
              value={value[0] ?? ""}
              onChange={(e) => onChange([e.target.value])}
              placeholder="Your answer"
            />
          )}

          {question.kind === "notebook" && (
            <div className="border-hairline bg-muted/40 overflow-hidden rounded-xs border">
              <CodeEditor
                value={value[0] ?? question.starterCode}
                language="python"
                onChange={(code) => onChange([code])}
                placeholder="Write your Python here"
              />
              <p className="border-hairline text-muted-foreground border-t px-3 py-1.5 text-xs">
                Hidden tests run against this code when you submit. Try it out in your notebook
                first if you like.
              </p>
            </div>
          )}

          {question.kind === "codeSnippet" && (
            <Textarea
              aria-label={`Answer to question ${index + 1}`}
              className="font-mono text-xs"
              rows={5}
              value={value[0] ?? ""}
              onChange={(e) => onChange([e.target.value])}
              placeholder="Your code"
            />
          )}
        </div>
      </div>
    </div>
  </fieldset>
);

/* --------------------------------- result ---------------------------------- */

const QuizResult = ({
  quiz,
  result: submitted,
  context,
}: {
  quiz: QuizTakeView;
  result: AttemptResult;
  context: AttemptContext;
}) => {
  // Notebook answers are graded after the submit returns, by a test run on the
  // notebook service. Their attempt is re-read (and polled while tests run) so
  // the screen follows it to a verdict and can show each test.
  const hasNotebook = quiz.questions.some((q) => q.kind === "notebook");
  const { data: detail } = useAttempt(submitted.attemptId, hasNotebook);

  const status: AttemptStatus = detail?.status ?? submitted.status;
  const passed = detail?.passed ?? submitted.passed;
  const scorePercent = detail?.scorePercent ?? submitted.scorePercent;
  const pointsAwarded = detail?.pointsAwarded ?? submitted.pointsAwarded;
  const pointsAvailable = detail?.pointsAvailable ?? submitted.pointsAvailable;
  const answers = detail?.answers ?? null;

  // The pass (and its course progress) is applied server-side when the tests
  // land, after the submit already invalidated these — so refresh them again.
  const queryClient = useQueryClient();
  const wasTesting = useRef(submitted.status === "pendingAutoGrade");
  useEffect(() => {
    if (wasTesting.current && status !== "pendingAutoGrade") {
      wasTesting.current = false;
      for (const key of [
        ["learning-progress"],
        ["learning-certificates"],
        ["assessment-attempts"],
      ]) {
        void queryClient.invalidateQueries({ queryKey: key });
      }
    }
  }, [status, queryClient]);

  // An attempt with tests running or a question under review has no verdict.
  // Reading `passed` then would render a perfectly good submission as "not
  // passed yet" and show a score that is only the floor already earned.
  const testing = status === "pendingAutoGrade";
  const reviewing = status === "pendingReview";
  const awaiting = answers
    ? answers.filter((a) => a.awaitingReview).length
    : submitted.answers.filter((a) => a.awaitingReview).length;

  return (
    <div className="space-y-4">
      <div
        className={cn(
          "border-hairline bg-card flex items-start gap-3 rounded-xs border p-5",
          testing || reviewing
            ? "border-sky-600/40"
            : passed
              ? "border-emerald-600/40"
              : "border-amber-600/40",
        )}
      >
        {testing ? (
          <Loader2 className="mt-0.5 size-5 shrink-0 animate-spin text-sky-600" />
        ) : reviewing ? (
          <Clock className="mt-0.5 size-5 shrink-0 text-sky-600" />
        ) : passed ? (
          <CheckCircle2 className="mt-0.5 size-5 shrink-0 text-emerald-600" />
        ) : (
          <XCircle className="mt-0.5 size-5 shrink-0 text-amber-600" />
        )}
        <div>
          <p className="font-heading text-ink text-lg">
            {testing
              ? "Running your tests…"
              : reviewing
                ? "Submitted — awaiting review"
                : passed
                  ? "Passed"
                  : "Not passed yet"}
          </p>

          {testing ? (
            <p className="text-muted-foreground mt-1 text-sm">
              {quiz.title} — your code is running against the exercise&apos;s tests. This usually
              takes a few seconds; you can leave and come back.
            </p>
          ) : reviewing ? (
            <>
              <p className="text-muted-foreground mt-1 text-sm">
                {quiz.title} — {awaiting} answer{awaiting === 1 ? "" : "s"}{" "}
                {awaiting === 1 ? "is" : "are"} with a marker. You&apos;ll be notified when
                it&apos;s scored.
              </p>
              {/* Deliberately no percentage: the auto-graded floor would read as
                  a final mark and it can only go up from here. */}
              <p className="text-muted-foreground mt-2 text-xs">
                {pointsAvailable - pointsAwarded} of {pointsAvailable} points are still to be
                decided, so there&apos;s no score to show yet.
              </p>
              {context !== "standalone" && (
                <p className="text-muted-foreground mt-2 text-sm">
                  Your course progress updates once this is marked.
                </p>
              )}
            </>
          ) : (
            <>
              <p className="text-muted-foreground mt-1 text-sm">
                {quiz.title} — {pointsAwarded} of {pointsAvailable} points ({scorePercent}%).
              </p>

              {/* Say plainly whether this counted, rather than leaving it implied. */}
              {passed && context !== "standalone" && (
                <p className="mt-2 text-sm text-emerald-700">
                  {detail
                    ? "This counts towards your course."
                    : submitted.courseProgressAdvanced
                      ? "Your course progress has been updated."
                      : "Scored, but it didn't update a course — you may not be enrolled."}
                </p>
              )}
              {passed && context === "standalone" && (
                <p className="text-muted-foreground mt-2 text-sm">
                  Taken from the library, so this doesn&apos;t change any course progress.
                </p>
              )}
            </>
          )}
        </div>
      </div>

      <div className="border-hairline bg-card rounded-xs border">
        <p className="border-hairline text-muted-foreground border-b px-4 py-2 text-xs font-medium uppercase">
          Per question
        </p>
        <ul className="divide-hairline divide-y px-4">
          {(answers ?? submitted.answers).map((answer, index) => (
            <AnswerRow
              key={answer.questionId}
              index={index}
              answer={answer}
              detail={answers ? (answer as AttemptAnswerDetail) : null}
            />
          ))}
        </ul>
      </div>
    </div>
  );
};

const AnswerRow = ({
  index,
  answer,
  detail,
}: {
  index: number;
  answer: {
    questionId: string;
    correct: boolean;
    pointsAwarded: number;
    pointsAvailable: number;
    awaitingReview: boolean;
  };
  detail: AttemptAnswerDetail | null;
}) => {
  const awaitingTests = detail?.awaitingTests ?? false;
  const pending = awaitingTests || answer.awaitingReview;
  return (
    <li className="py-2 text-sm">
      <div className="flex items-center gap-3">
        {awaitingTests ? (
          <Loader2 className="size-4 shrink-0 animate-spin text-sky-600" />
        ) : answer.awaitingReview ? (
          <Clock className="size-4 shrink-0 text-sky-600" />
        ) : answer.correct ? (
          <CheckCircle2 className="size-4 shrink-0 text-emerald-600" />
        ) : (
          <XCircle className="text-muted-foreground size-4 shrink-0" />
        )}
        <span className="flex-1">
          Question {index + 1}
          {awaitingTests && <span className="text-muted-foreground"> · running tests</span>}
        </span>
        <span className="text-muted-foreground text-xs tabular-nums">
          {pending && !detail?.testReport
            ? `— /${answer.pointsAvailable}`
            : `${answer.pointsAwarded}/${answer.pointsAvailable}`}
        </span>
      </div>
      {detail?.testReport && <TestReportView report={detail.testReport} />}
      {detail?.feedback && (
        <p className="text-muted-foreground mt-1.5 ml-7 text-xs">
          <span className="text-ink font-medium">Marker&apos;s note:</span> {detail.feedback}
        </p>
      )}
    </li>
  );
};

/** One line per test; the failure message is the author's assert message. */
const TestReportView = ({ report }: { report: TestReport }) => {
  if ("error" in report) {
    return (
      <div className="mt-2 ml-7">
        <p className="text-ink text-xs font-medium">Your code didn&apos;t run to the end</p>
        <pre className="bg-destructive/5 text-ink mt-1 overflow-x-auto rounded-xs px-2 py-1.5 text-xs whitespace-pre-wrap">
          {report.error}
        </pre>
      </div>
    );
  }
  return (
    <div className="mt-2 ml-7">
      <p className="text-muted-foreground text-xs">
        {report.passed} of {report.total} test{report.total === 1 ? "" : "s"} passed
      </p>
      {report.tests && (
        <ul className="mt-1 space-y-0.5">
          {report.tests.map((test) => (
            <li key={test.name} className="flex items-start gap-2 text-xs">
              {test.passed ? (
                <CheckCircle2 className="mt-0.5 size-3.5 shrink-0 text-emerald-600" />
              ) : (
                <XCircle className="mt-0.5 size-3.5 shrink-0 text-amber-600" />
              )}
              <span className="min-w-0">
                <code className="text-ink">{test.name}</code>
                {!test.passed && test.message && (
                  <span className="text-muted-foreground block break-words">{test.message}</span>
                )}
              </span>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
};
