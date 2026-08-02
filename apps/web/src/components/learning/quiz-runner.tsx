"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import { AlertTriangle, CheckCircle2, XCircle } from "lucide-react";

import { Badge, Button, Input, Textarea, cn } from "@datarango/ui";

import {
  useQuiz,
  useSubmitQuiz,
  type AttemptContext,
  type AttemptResult,
  type QuizQuestion,
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
    submit.mutate(
      { context, courseId, courseVersionId, lessonId, moduleId, responses: answers },
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
    return <QuizResult quiz={quiz.title} result={result} context={context} />;
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
        <p className="text-ink text-sm font-medium">{question.prompt}</p>
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
  result,
  context,
}: {
  quiz: string;
  result: AttemptResult;
  context: AttemptContext;
}) => (
  <div className="space-y-4">
    <div
      className={cn(
        "border-hairline bg-card flex items-start gap-3 rounded-xs border p-5",
        result.passed ? "border-emerald-600/40" : "border-amber-600/40",
      )}
    >
      {result.passed ? (
        <CheckCircle2 className="mt-0.5 size-5 shrink-0 text-emerald-600" />
      ) : (
        <XCircle className="mt-0.5 size-5 shrink-0 text-amber-600" />
      )}
      <div>
        <p className="font-heading text-ink text-lg">
          {result.passed ? "Passed" : "Not passed yet"}
        </p>
        <p className="text-muted-foreground mt-1 text-sm">
          {quiz} — {result.pointsAwarded} of {result.pointsAvailable} points ({result.scorePercent}
          %).
        </p>

        {/* Say plainly whether this counted, rather than leaving it implied. */}
        {result.passed && context !== "standalone" && (
          <p className="mt-2 text-sm text-emerald-700">
            {result.courseProgressAdvanced
              ? "Your course progress has been updated."
              : "Scored, but it didn't update a course — you may not be enrolled."}
          </p>
        )}
        {result.passed && context === "standalone" && (
          <p className="text-muted-foreground mt-2 text-sm">
            Taken from the library, so this doesn&apos;t change any course progress.
          </p>
        )}
      </div>
    </div>

    <div className="border-hairline bg-card rounded-xs border">
      <p className="border-hairline text-muted-foreground border-b px-4 py-2 text-xs font-medium uppercase">
        Per question
      </p>
      <ul className="px-4 py-2">
        {result.answers.map((answer, index) => (
          <li className="flex items-center gap-3 py-1.5 text-sm" key={answer.questionId}>
            {answer.correct ? (
              <CheckCircle2 className="size-4 shrink-0 text-emerald-600" />
            ) : (
              <XCircle className="text-muted-foreground size-4 shrink-0" />
            )}
            <span className="flex-1">Question {index + 1}</span>
            <span className="text-muted-foreground text-xs">
              {answer.pointsAwarded}/{answer.pointsAvailable}
            </span>
          </li>
        ))}
      </ul>
    </div>
  </div>
);
