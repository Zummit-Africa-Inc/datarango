"use client";

import Link from "next/link";

import { Badge, PageLayout, Skeleton } from "@datarango/ui";

import { CreateQuizDialog } from "@/components/create-quiz-dialog";
import { useMyQuizzes } from "@/hooks/assessment";

/** "Unlimited" is the meaning of 0, and reads better than the number. */
const attemptsLabel = (maxAttempts: number) =>
  maxAttempts === 0 ? "Unlimited attempts" : `${maxAttempts} attempt${maxAttempts === 1 ? "" : "s"}`;

const timeLabel = (seconds: number | null) =>
  seconds === null ? "Untimed" : `${Math.round(seconds / 60)} min`;

export default function QuizzesPage() {
  const { data, isLoading } = useMyQuizzes();
  const quizzes = data?.quizzes ?? [];

  return (
    <PageLayout
      title="Quizzes"
      subtitle="Standalone quizzes you can attach to a lesson or set as a module exercise."
      actions={[<CreateQuizDialog key="create" />]}
    >
      {isLoading ? (
        <Skeleton skeleton="table" rows={5} columns={3} />
      ) : quizzes.length === 0 ? (
        <div className="border-hairline bg-card rounded-xs border px-6 py-16 text-center">
          <p className="font-heading text-ink text-lg">No quizzes yet</p>
          <p className="text-muted-foreground mx-auto mt-1 max-w-md text-sm">
            Every module needs an end-of-module exercise before its course can be published, and
            that exercise is a quiz — so this is usually the first stop.
          </p>
        </div>
      ) : (
        <div className="border-hairline bg-card overflow-hidden rounded-xs border">
          <div className="border-hairline text-muted-foreground grid grid-cols-[1fr_auto_auto_auto] gap-4 border-b px-4 py-2 text-xs font-medium uppercase">
            <span>Quiz</span>
            <span>Rules</span>
            <span>Status</span>
            <span className="text-right">Updated</span>
          </div>
          {quizzes.map((quiz) => (
            <Link
              key={quiz.id}
              href={`/quizzes/${quiz.id}`}
              className="border-hairline hover:bg-muted/50 grid grid-cols-[1fr_auto_auto_auto] items-center gap-4 border-b px-4 py-3 text-sm transition-colors last:border-0"
            >
              <div className="min-w-0">
                <p className="text-ink truncate font-medium">{quiz.title}</p>
                <p className="text-muted-foreground truncate text-xs">
                  {quiz.description || "No description."}
                </p>
              </div>
              <span className="text-muted-foreground text-xs">
                Pass {quiz.passThresholdPercent}% · {attemptsLabel(quiz.maxAttempts)} ·{" "}
                {timeLabel(quiz.timeLimitSeconds)}
              </span>
              <Badge variant={quiz.status === "published" ? "success" : "outline"}>
                {quiz.status === "published" ? "Published" : "Draft"}
              </Badge>
              <span className="text-muted-foreground text-right text-xs">
                {new Date(quiz.updatedAt).toLocaleDateString()}
              </span>
            </Link>
          ))}
        </div>
      )}
    </PageLayout>
  );
}
