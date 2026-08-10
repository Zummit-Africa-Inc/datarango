"use client";

import { useState } from "react";
import Link from "next/link";
import { Clock, ListChecks, Search } from "lucide-react";

import { Badge, Button, Input, PageLayout, Skeleton } from "@datarango/ui";

import { useDiscoverQuizzes, type QuizLibraryItem } from "@/hooks/assessment";

const PAGE_SIZE = 12;

export default function QuizzesPage() {
  const [search, setSearch] = useState("");
  const [submitted, setSubmitted] = useState("");
  const [page, setPage] = useState(1);

  const { data, isLoading } = useDiscoverQuizzes({
    search: submitted,
    page,
    pageSize: PAGE_SIZE,
  });

  const quizzes = data?.quizzes ?? [];
  const total = data?.total ?? 0;
  const lastPage = Math.max(1, Math.ceil(total / PAGE_SIZE));

  const runSearch = (e: React.FormEvent) => {
    e.preventDefault();
    setSubmitted(search.trim());
    setPage(1);
  };

  return (
    <PageLayout
      title="Quizzes"
      subtitle="Practice quizzes published on Datarango. Taking one here is practice — it doesn't advance a course."
    >
      <form onSubmit={runSearch} className="flex max-w-md items-center gap-2">
        <Input
          aria-label="Search quizzes"
          placeholder="Search quizzes…"
          value={search}
          onChange={(e) => setSearch(e.target.value)}
        />
        <Button type="submit" variant="outline">
          <Search className="size-4" />
          Search
        </Button>
      </form>

      {isLoading ? (
        <Skeleton skeleton="list" count={6} />
      ) : quizzes.length === 0 ? (
        <div className="border-hairline bg-card rounded-xs border px-6 py-16 text-center">
          <p className="font-heading text-ink text-lg">
            {submitted ? "Nothing matches that search" : "No quizzes published yet"}
          </p>
          <p className="text-muted-foreground mt-1 text-sm">
            {submitted
              ? "Try a different term."
              : "Once creators publish a quiz, it shows up here."}
          </p>
        </div>
      ) : (
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {quizzes.map((quiz) => (
            <QuizCard key={quiz.quizId} quiz={quiz} />
          ))}
        </div>
      )}

      {lastPage > 1 && (
        <div className="flex items-center justify-between">
          <p className="text-muted-foreground text-sm">
            Page {page} of {lastPage} · {total} quiz{total === 1 ? "" : "zes"}
          </p>
          <div className="flex gap-2">
            <Button
              size="sm"
              variant="outline"
              disabled={page <= 1}
              onClick={() => setPage((p) => p - 1)}
            >
              Previous
            </Button>
            <Button
              size="sm"
              variant="outline"
              disabled={page >= lastPage}
              onClick={() => setPage((p) => p + 1)}
            >
              Next
            </Button>
          </div>
        </div>
      )}
    </PageLayout>
  );
}

const QuizCard = ({ quiz }: { quiz: QuizLibraryItem }) => {
  const exhausted = quiz.maxAttempts > 0 && quiz.attemptsUsed >= quiz.maxAttempts;

  return (
    <Link
      href={`/dashboard/quizzes/${quiz.quizId}`}
      className="border-hairline bg-card hover:border-primary-500/40 flex flex-col rounded-xs border p-5 transition-colors"
    >
      <div className="flex items-start justify-between gap-3">
        <h2 className="font-heading text-ink text-lg leading-snug">{quiz.title}</h2>
        {/*
          Awaiting review outranks the others: a learner with a submission
          being marked has neither passed nor merely "attempted", and telling
          them either would be wrong in the same breath.
        */}
        {quiz.awaitingReview ? (
          <Badge variant="outline">Being marked</Badge>
        ) : quiz.passed ? (
          <Badge variant="success">Passed</Badge>
        ) : (
          quiz.attemptsUsed > 0 && <Badge variant="outline">Attempted</Badge>
        )}
      </div>

      <p className="text-muted-foreground mt-2 line-clamp-2 flex-1 text-sm leading-relaxed">
        {quiz.description || "No description."}
      </p>

      <div className="text-muted-foreground mt-4 flex flex-wrap items-center gap-x-3 gap-y-1 text-xs">
        <span className="inline-flex items-center gap-1">
          <ListChecks className="size-3.5" />
          {quiz.questionCount} question{quiz.questionCount === 1 ? "" : "s"}
        </span>
        <span>{quiz.passThresholdPercent}% to pass</span>
        {quiz.timeLimitSeconds !== null && (
          <span className="inline-flex items-center gap-1">
            <Clock className="size-3.5" />
            {Math.round(quiz.timeLimitSeconds / 60)} min
          </span>
        )}
      </div>

      {/*
        Best score is null until they submit something. Rendering that as 0%
        would tell a learner they scored nothing on a quiz they have never
        opened, so the untouched case says nothing at all.
      */}
      {quiz.attemptsUsed > 0 && (
        <p className="text-muted-foreground mt-2 text-xs">
          {/*
            bestScorePercent is null while the only attempt is still being
            marked — the server excludes pending attempts from the aggregate on
            purpose, since their score is just the auto-graded floor.
          */}
          {quiz.bestScorePercent === null ? "Not scored yet" : `Best ${quiz.bestScorePercent}%`} ·{" "}
          {quiz.maxAttempts > 0
            ? `${quiz.attemptsUsed} of ${quiz.maxAttempts} attempt${quiz.maxAttempts === 1 ? "" : "s"} used`
            : `${quiz.attemptsUsed} attempt${quiz.attemptsUsed === 1 ? "" : "s"}`}
        </p>
      )}

      <span className="text-primary-500 mt-4 text-sm font-medium">
        {quiz.awaitingReview
          ? "View submission →"
          : exhausted
            ? "Review →"
            : quiz.attemptsUsed > 0
              ? "Try again →"
              : "Start quiz →"}
      </span>
    </Link>
  );
};
