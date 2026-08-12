"use client";

import { useMemo } from "react";
import Link from "next/link";
import { CheckCircle2, Clock, RotateCcw } from "lucide-react";

import { useInbox } from "@datarango/realtime";
import { Button, PageLayout, Skeleton } from "@datarango/ui";

import { CourseStatusBadge } from "@/components/course-status-badge";
import { useMyCourses, useWithdrawFromReview, type Course } from "@/hooks/catalog";

const PAGE_SIZE = 100;

export default function ReviewStatusPage() {
  // One unpaged read rather than three filtered ones: this page is about the
  // handful of courses currently moving through review, and a creator with more
  // than a hundred of those has a different problem.
  const { data, isLoading } = useMyCourses({ pageSize: PAGE_SIZE });
  const courses = useMemo(() => data?.courses ?? [], [data]);

  // The creator's own inbox — the only place a rejection reason exists.
  const { items: inboxEntries } = useInbox();

  const inReview = courses.filter((c) => c.status === "review");
  const published = courses.filter((c) => c.status === "published");
  const drafts = courses.filter((c) => c.status === "draft");

  /**
   * Rejection reasons, joined from the creator's own notification inbox.
   *
   * A rejected course goes back to `draft` and the status carries no memory of
   * why — the reason rides on `dr.catalog.course.rejected`, which the platform
   * turns into an in-app notification. So the inbox is where the answer is, and
   * without it this page could show that a course came back but never what to
   * fix, which is the version of this feature that makes creators give up.
   *
   * Keyed by course, newest first, so a resubmitted-and-rejected-again course
   * shows the current reason rather than the first one.
   */
  const rejections = useMemo(() => {
    const byCourse = new Map<string, { reason: string; at: string }>();
    for (const entry of inboxEntries) {
      if (entry.template !== "course-rejected") continue;
      const courseId = entry.payload.courseId;
      const reason = entry.payload.reason;
      if (typeof courseId !== "string" || typeof reason !== "string") continue;
      const existing = byCourse.get(courseId);
      if (!existing || existing.at < entry.createdAt) {
        byCourse.set(courseId, { reason, at: entry.createdAt });
      }
    }
    return byCourse;
  }, [inboxEntries]);

  return (
    <PageLayout
      title="Review status"
      subtitle="Where your courses stand with the platform review team."
    >
      {isLoading ? (
        <Skeleton skeleton="table" rows={4} columns={3} />
      ) : courses.length === 0 ? (
        <div className="border-hairline bg-card rounded-xs border px-6 py-16 text-center">
          <p className="font-heading text-ink text-lg">Nothing to review yet</p>
          <p className="text-muted-foreground mx-auto mt-1 max-w-md text-sm">
            Build a course, give every module an exercise, and submit it. A reviewer publishes it —
            that is the only way a course reaches learners.
          </p>
          <Button asChild size="sm" variant="outline" className="mt-3">
            <Link href="/courses">Go to courses</Link>
          </Button>
        </div>
      ) : (
        <div className="space-y-6">
          <Section
            title="Waiting on a reviewer"
            icon={Clock}
            empty="Nothing submitted right now."
            courses={inReview}
            renderAction={(course) => <WithdrawButton course={course} />}
          />

          <Section
            title="Needs changes"
            icon={RotateCcw}
            empty="No course has come back to you."
            // A rejected course is a draft again, so it is drafts-with-a-reason
            // that belong here — not a status of their own.
            courses={drafts.filter((c) => rejections.has(c.id))}
            renderDetail={(course) => {
              const rejection = rejections.get(course.id);
              return rejection ? (
                <p className="text-muted-foreground mt-1 text-sm">
                  <span className="text-ink font-medium">Reviewer:</span> {rejection.reason}
                </p>
              ) : null;
            }}
          />

          <Section
            title="Published"
            icon={CheckCircle2}
            empty="Nothing published yet."
            courses={published}
          />
        </div>
      )}
    </PageLayout>
  );
}

const Section = ({
  title,
  icon: Icon,
  empty,
  courses,
  renderAction,
  renderDetail,
}: {
  title: string;
  icon: React.ComponentType<{ className?: string }>;
  empty: string;
  courses: Course[];
  renderAction?: (course: Course) => React.ReactNode;
  renderDetail?: (course: Course) => React.ReactNode;
}) => (
  <section>
    <h2 className="text-ink font-heading mb-2 flex items-center gap-2 text-sm">
      <Icon className="text-muted-foreground size-4" />
      {title}
      <span className="text-muted-foreground font-sans text-xs">({courses.length})</span>
    </h2>

    {courses.length === 0 ? (
      <p className="text-muted-foreground border-hairline rounded-xs border px-4 py-3 text-sm">
        {empty}
      </p>
    ) : (
      <div className="border-hairline bg-card overflow-hidden rounded-xs border">
        {courses.map((course) => (
          <div
            key={course.id}
            className="border-hairline flex items-start gap-4 border-b px-4 py-3 last:border-0"
          >
            <div className="min-w-0 flex-1">
              <Link
                href={`/courses/${course.id}`}
                className="text-ink hover:text-primary truncate text-sm font-medium transition-colors"
              >
                {course.title}
              </Link>
              <p className="text-muted-foreground truncate font-mono text-xs">{course.slug}</p>
              {renderDetail?.(course)}
            </div>
            <CourseStatusBadge status={course.status} />
            {renderAction?.(course)}
          </div>
        ))}
      </div>
    )}
  </section>
);

const WithdrawButton = ({ course }: { course: Course }) => {
  const withdraw = useWithdrawFromReview(course.id);
  return (
    <Button
      size="sm"
      variant="outline"
      disabled={withdraw.isPending}
      onClick={() => withdraw.mutate()}
    >
      {withdraw.isPending ? "Withdrawing…" : "Withdraw"}
    </Button>
  );
};
