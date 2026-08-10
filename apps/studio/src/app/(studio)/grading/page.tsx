"use client";

import { useState } from "react";
import Link from "next/link";
import { Clock } from "lucide-react";

import { Badge, Button, PageLayout, Skeleton } from "@datarango/ui";

import { useGradingQueue, type GradingQueueItem } from "@/hooks/grading";

const PAGE_SIZE = 20;

/**
 * The creator's grading queue — submissions on their own quizzes awaiting a
 * mark.
 *
 * Oldest first, because this is a queue people are waiting in and the fair
 * order is the order they arrived, not the newest-first that most lists want.
 */
export default function GradingPage() {
  const [page, setPage] = useState(1);
  const { data, isLoading } = useGradingQueue({ page, pageSize: PAGE_SIZE });

  const items = data?.items ?? [];
  const total = data?.total ?? 0;
  const lastPage = Math.max(1, Math.ceil(total / PAGE_SIZE));

  return (
    <PageLayout
      title="Grading"
      subtitle="Written answers on your quizzes waiting to be marked. Learners aren't told pass or fail until you've marked them."
    >
      {isLoading ? (
        <Skeleton skeleton="list" count={4} />
      ) : items.length === 0 ? (
        <div className="border-hairline bg-card rounded-xs border px-6 py-16 text-center">
          <p className="font-heading text-ink text-lg">Nothing to mark</p>
          <p className="text-muted-foreground mx-auto mt-1 max-w-md text-sm">
            Submissions land here when a question is set to &ldquo;I&apos;ll mark this one
            myself&rdquo;. Everything else is graded the moment it&apos;s submitted.
          </p>
        </div>
      ) : (
        <ul className="space-y-2">
          {items.map((item) => (
            <QueueRow key={item.attemptId} item={item} />
          ))}
        </ul>
      )}

      {lastPage > 1 && (
        <div className="flex items-center justify-between">
          <p className="text-muted-foreground text-sm">
            Page {page} of {lastPage} · {total} waiting
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

const QueueRow = ({ item }: { item: GradingQueueItem }) => {
  const waiting = Date.now() - new Date(item.submittedAt).getTime();
  const days = Math.floor(waiting / 86_400_000);

  return (
    <li>
      <Link
        href={`/grading/${item.attemptId}`}
        className="border-hairline bg-card hover:border-primary-500/40 flex flex-wrap items-center gap-x-4 gap-y-2 rounded-xs border px-4 py-3 transition-colors"
      >
        <div className="min-w-0 flex-1">
          <p className="text-ink truncate text-sm font-medium">{item.quizTitle}</p>
          {/*
            An id, not a name: names live in accounts and the grading module has
            no business resolving them. A creator's quiz can be taken by anyone
            on the platform, so there is no directory to join against here the
            way console has for its own members.
          */}
          <p className="text-muted-foreground mt-0.5 font-mono text-xs">
            Learner {item.userId.slice(0, 8)}
          </p>
        </div>

        <Badge variant="outline">
          {item.answersAwaitingReview} answer{item.answersAwaitingReview === 1 ? "" : "s"}
        </Badge>
        <span className="text-muted-foreground text-xs tabular-nums">
          {item.pointsAwaitingReview} pt{item.pointsAwaitingReview === 1 ? "" : "s"} to decide
        </span>
        <span className="text-muted-foreground inline-flex items-center gap-1 text-xs">
          <Clock className="size-3.5" />
          {days === 0 ? "today" : days === 1 ? "1 day" : `${days} days`}
        </span>
      </Link>
    </li>
  );
};
