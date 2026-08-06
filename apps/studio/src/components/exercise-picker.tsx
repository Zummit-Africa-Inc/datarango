"use client";

import { useState } from "react";
import Link from "next/link";
import { AlertTriangle, Check } from "lucide-react";

import {
  Badge,
  Button,
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@datarango/ui";

import { useMyQuizzes } from "@/hooks/assessment";

/**
 * Sets a module's end-of-module exercise.
 *
 * This is the join between the two halves of Phase 2: a module cannot be
 * published without an exercise, the exercise is a quiz, and a learner completes
 * the module only by passing it. Lessons alone never finish a module.
 *
 * Only **published** quizzes are offered. A draft is invisible to learners
 * (RLS admits non-owners to published rows only), so attaching one would produce
 * a module nobody could ever complete — the failure would surface much later, to
 * the learner rather than the author.
 */
export const ExercisePicker = ({
  moduleTitle,
  exerciseId,
  onSelect,
  pending,
}: {
  moduleTitle: string;
  exerciseId: string | null;
  onSelect: (quizId: string) => void;
  pending: boolean;
}) => {
  const [open, setOpen] = useState(false);
  const { data, isLoading } = useMyQuizzes();

  const publishable = (data?.quizzes ?? []).filter((q) => q.status === "published");
  const drafts = (data?.quizzes ?? []).filter((q) => q.status === "draft");
  const current = (data?.quizzes ?? []).find((q) => q.id === exerciseId);

  const choose = (quizId: string) => {
    onSelect(quizId);
    setOpen(false);
  };

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <button
          type="button"
          className="focus-visible:ring-ring rounded-xs focus-visible:ring-2 focus-visible:outline-none"
          aria-label={
            exerciseId ? `Change exercise for ${moduleTitle}` : `Set exercise for ${moduleTitle}`
          }
        >
          {exerciseId ? (
            <Badge variant="success">Exercise set</Badge>
          ) : (
            <Badge variant="outline" className="gap-1">
              <AlertTriangle className="size-3" />
              No exercise
            </Badge>
          )}
        </button>
      </DialogTrigger>

      <DialogContent>
        <DialogHeader>
          <DialogTitle>End-of-module exercise</DialogTitle>
          <DialogDescription>
            {moduleTitle} completes only when every lesson is done <em>and</em> this quiz is passed.
            Only published quizzes can be used — a draft is invisible to learners, so the module
            could never be completed.
          </DialogDescription>
        </DialogHeader>

        <div className="max-h-80 space-y-1 overflow-y-auto py-2">
          {isLoading ? (
            <p className="text-muted-foreground text-sm">Loading your quizzes…</p>
          ) : publishable.length === 0 ? (
            <div className="border-hairline rounded-xs border px-4 py-6 text-center">
              <p className="text-ink text-sm font-medium">No published quizzes yet</p>
              <p className="text-muted-foreground mt-1 text-sm">
                {drafts.length > 0
                  ? `You have ${drafts.length} draft${drafts.length === 1 ? "" : "s"} — publish one to use it as an exercise.`
                  : "Create a quiz, add its questions, and publish it."}
              </p>
              <Button asChild size="sm" variant="outline" className="mt-3">
                <Link href="/quizzes">Go to quizzes</Link>
              </Button>
            </div>
          ) : (
            publishable.map((quiz) => {
              const selected = quiz.id === exerciseId;
              return (
                <button
                  key={quiz.id}
                  type="button"
                  disabled={pending}
                  onClick={() => choose(quiz.id)}
                  className="border-hairline hover:bg-muted/50 flex w-full items-center gap-3 rounded-xs border px-3 py-2 text-left text-sm transition-colors disabled:opacity-60"
                >
                  <Check
                    className={selected ? "text-ink size-4 shrink-0" : "size-4 shrink-0 opacity-0"}
                  />
                  <span className="min-w-0 flex-1">
                    <span className="text-ink block truncate font-medium">{quiz.title}</span>
                    <span className="text-muted-foreground block truncate text-xs">
                      Pass {quiz.passThresholdPercent}% ·{" "}
                      {quiz.maxAttempts === 0
                        ? "unlimited attempts"
                        : `${quiz.maxAttempts} attempts`}
                    </span>
                  </span>
                </button>
              );
            })
          )}
        </div>

        {current && (
          <p className="text-muted-foreground text-xs">
            Currently set to <span className="text-ink font-medium">{current.title}</span>.
          </p>
        )}

        <DialogFooter>
          <Button type="button" variant="ghost" onClick={() => setOpen(false)}>
            Close
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};
