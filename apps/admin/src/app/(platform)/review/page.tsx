"use client";

import { useState } from "react";
import { ClipboardList } from "lucide-react";

import { usePlatformRole } from "@datarango/auth";
import { Button, PageLayout, Skeleton } from "@datarango/ui";

import { ReviewCourseDetail } from "@/components/review-course-detail";
import { useReviewQueue, type ReviewQueueItem } from "@/hooks/review";

const PAGE_SIZE = 25;

export default function ReviewQueuePage() {
  const [page, setPage] = useState(1);
  const [selected, setSelected] = useState<ReviewQueueItem | null>(null);

  // Checked before rendering rather than letting the call 403. Admin implies
  // reviewer; support deliberately does not — reading operational data and
  // deciding what the platform publishes are different powers.
  const canReview = usePlatformRole("platform.reviewer");

  const { data, isLoading } = useReviewQueue({ page, pageSize: PAGE_SIZE });
  const items = data ?? [];

  if (!canReview) {
    return (
      <PageLayout title="Review queue" subtitle="Courses waiting on a platform decision.">
        <div className="border-hairline bg-card rounded-xs border px-6 py-12 text-center">
          <p className="font-heading text-ink text-lg">You don&apos;t have reviewer access</p>
          <p className="text-muted-foreground mx-auto mt-1 max-w-md text-sm">
            Deciding what the platform publishes needs the reviewer role specifically. Support
            access covers reading operational data and does not include it — they&apos;re different
            powers, not a ladder.
          </p>
        </div>
      </PageLayout>
    );
  }

  if (selected) {
    return (
      <ReviewCourseDetail
        item={selected}
        onDone={() => {
          setSelected(null);
          // Back to page 1: the decided course has left the queue, so the page
          // the reviewer was on may no longer hold what it did.
          setPage(1);
        }}
      />
    );
  }

  return (
    <PageLayout
      title="Review queue"
      subtitle="Courses waiting on a platform decision. Approving publishes them."
    >
      {isLoading ? (
        <Skeleton skeleton="table" rows={4} columns={3} />
      ) : items.length === 0 ? (
        <div className="border-hairline bg-card rounded-xs border px-6 py-16 text-center">
          <ClipboardList className="text-muted-foreground mx-auto size-8" strokeWidth={1.5} />
          <p className="font-heading text-ink mt-3 text-lg">Nothing waiting</p>
          <p className="text-muted-foreground mx-auto mt-1 max-w-md text-sm">
            Courses appear here when a creator submits them. A course cannot reach learners any
            other way.
          </p>
        </div>
      ) : (
        <div className="border-hairline bg-card overflow-hidden rounded-xs border">
          <div className="border-hairline text-muted-foreground grid grid-cols-[1fr_auto_auto_auto] gap-4 border-b px-4 py-2 text-xs font-medium uppercase">
            <span>Course</span>
            <span>Modules</span>
            <span>Waiting since</span>
            <span className="text-right">Action</span>
          </div>
          {items.map((item) => (
            <div
              key={item.courseId}
              className="border-hairline grid grid-cols-[1fr_auto_auto_auto] items-center gap-4 border-b px-4 py-3 text-sm last:border-0"
            >
              <div className="min-w-0">
                <p className="text-ink truncate font-medium">{item.title}</p>
                <p className="text-muted-foreground truncate text-xs">
                  {item.summary || "No summary."}
                </p>
              </div>
              <span className="text-muted-foreground text-xs">{item.moduleCount}</span>
              <span className="text-muted-foreground text-xs">{waitingFor(item.submittedAt)}</span>
              <Button size="sm" onClick={() => setSelected(item)}>
                Review
              </Button>
            </div>
          ))}
        </div>
      )}

      {/* No total is returned — the queue is a working list, not a corpus — so
          paging is "is this page full", which is the only honest signal. */}
      {(page > 1 || items.length === PAGE_SIZE) && (
        <div className="flex items-center justify-between">
          <p className="text-muted-foreground text-sm">Page {page}</p>
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
              disabled={items.length < PAGE_SIZE}
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

/**
 * How long this has been waiting.
 *
 * Elapsed time rather than a date, because the thing a reviewer needs to notice
 * is a course that has been sitting for a week — a timestamp makes them do that
 * arithmetic themselves.
 */
const waitingFor = (submittedAt: string): string => {
  const ms = Date.now() - new Date(submittedAt).getTime();
  const hours = Math.floor(ms / 3_600_000);
  if (hours < 1) return "just now";
  if (hours < 24) return `${hours}h`;
  const days = Math.floor(hours / 24);
  return `${days}d`;
};
