"use client";

import { useMemo } from "react";
import Link from "next/link";
import { ArrowRight, BookOpen, CheckCircle2, FileBadge, ListChecks } from "lucide-react";

import { Badge, Button, Skeleton, Statistics } from "@datarango/ui";

import {
  useCourseProgress,
  useDiscoverCourses,
  useMyCertificates,
  useMyEnrollments,
  type Enrollment,
} from "@/hooks/learning";
import { useMyAttempts, type QuizAttempt } from "@/hooks/assessment";

const CONTINUE_LIMIT = 3;
const RECENT_ATTEMPTS = 5;

export default function DashboardPage() {
  const { data: enrolled, isLoading: enrollmentsLoading } = useMyEnrollments();
  const { data: certificates } = useMyCertificates();
  const { data: attempts } = useMyAttempts();

  // Enrolment rows carry course ids, not titles. One discovery read resolves
  // every title on this page — a per-course lookup would be an N+1 on the
  // learner's landing page, which is the worst place for one.
  const { data: catalogue } = useDiscoverCourses({ pageSize: 100 });

  const enrollments = useMemo(() => enrolled?.enrollments ?? [], [enrolled]);
  const titles = useMemo(
    () => new Map((catalogue?.courses ?? []).map((c) => [c.id, c.title] as const)),
    [catalogue],
  );

  const inProgress = useMemo(
    () =>
      enrollments
        .filter((e) => e.completedAt === null)
        .sort((a, b) => b.createdAt.localeCompare(a.createdAt)),
    [enrollments],
  );
  const completedCount = enrollments.length - inProgress.length;

  const attemptList = useMemo(() => attempts?.attempts ?? [], [attempts]);
  // Distinct quizzes passed, not attempts passed — passing the same quiz three
  // times is one achievement, and counting attempts would inflate it.
  const quizzesPassed = useMemo(
    () => new Set(attemptList.filter((a) => a.passed).map((a) => a.quizId)).size,
    [attemptList],
  );

  return (
    <div className="space-y-6">
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <Statistics
          label="IN PROGRESS"
          value={String(inProgress.length)}
          icon={BookOpen}
          description={inProgress.length === 1 ? "course" : "courses"}
        />
        <Statistics
          label="COMPLETED"
          value={String(completedCount)}
          icon={CheckCircle2}
          description={completedCount === 1 ? "course" : "courses"}
        />
        <Statistics
          label="CERTIFICATES"
          value={String(certificates?.certificates.length ?? 0)}
          icon={FileBadge}
          description="earned"
        />
        <Statistics
          label="QUIZZES PASSED"
          value={String(quizzesPassed)}
          icon={ListChecks}
          description="distinct quizzes"
        />
      </div>

      {/*
        Streaks, XP and token balance belong to the gamification and wallet
        modules, which are not built. They used to render here as zeros with a
        "+0" delta, which reads as real data saying the learner has done
        nothing — a worse lie than an absent tile. They come back when there is
        something behind them.
      */}

      <section className="space-y-3">
        <div className="flex items-center justify-between">
          <h2 className="font-heading text-lg">Continue learning</h2>
          <Button asChild size="sm" variant="ghost">
            <Link href="/dashboard/courses">
              All courses <ArrowRight className="size-4" />
            </Link>
          </Button>
        </div>

        {enrollmentsLoading ? (
          <Skeleton skeleton="list" count={3} />
        ) : inProgress.length === 0 ? (
          <EmptyState
            title={
              enrollments.length > 0
                ? "You've finished everything you started"
                : "You're not enrolled in anything yet"
            }
            body={
              enrollments.length > 0
                ? "Browse the catalogue for something new."
                : "Find a course and enrol — your progress will show up here."
            }
            href="/dashboard/courses"
            cta="Browse courses"
          />
        ) : (
          <div className="grid gap-4 lg:grid-cols-3">
            {inProgress.slice(0, CONTINUE_LIMIT).map((enrollment) => (
              <ContinueCard
                key={enrollment.id}
                enrollment={enrollment}
                title={titles.get(enrollment.courseId)}
              />
            ))}
          </div>
        )}
      </section>

      <section className="space-y-3">
        <div className="flex items-center justify-between">
          <h2 className="font-heading text-lg">Recent quiz attempts</h2>
          <Button asChild size="sm" variant="ghost">
            <Link href="/dashboard/quizzes">
              Quiz library <ArrowRight className="size-4" />
            </Link>
          </Button>
        </div>

        {attemptList.length === 0 ? (
          <EmptyState
            title="No attempts yet"
            body="Practice quizzes from the library, or take one inside a course."
            href="/dashboard/quizzes"
            cta="Browse quizzes"
          />
        ) : (
          <div className="border-hairline bg-card overflow-hidden rounded-xs border">
            {attemptList.slice(0, RECENT_ATTEMPTS).map((attempt) => (
              <AttemptRow key={attempt.id} attempt={attempt} />
            ))}
          </div>
        )}
      </section>
    </div>
  );
}

/**
 * One in-progress course. Progress is its own query per card rather than a
 * field on the enrolment row — the enrolment says what you signed up for, the
 * snapshot says how far you've got, and only the second is recomputed from
 * lesson rows.
 */
const ContinueCard = ({
  enrollment,
  title,
}: {
  enrollment: Enrollment;
  title: string | undefined;
}) => {
  const { data: progress } = useCourseProgress(enrollment.courseId, true);
  const percent = progress?.percentComplete ?? 0;

  return (
    <Link
      href={`/dashboard/courses/${enrollment.courseId}`}
      className="border-hairline bg-card hover:border-primary-500/40 block rounded-xs border p-5 transition-colors"
    >
      <p className="text-muted-foreground text-xs">
        {enrollment.grantedByOrgId ? "Assigned by your organization" : "Personal enrolment"}
      </p>
      {/*
        A course the catalogue no longer returns (unpublished since enrolling)
        has no title to show. The enrolment is still valid and still opens, so
        the card stays — it just says what it doesn't know.
      */}
      <p className="font-heading mt-1 text-xl">{title ?? "Untitled course"}</p>

      <div className="bg-muted mt-4 h-2 rounded-full">
        <div
          className="bg-primary-500 h-2 rounded-full transition-all"
          style={{ width: `${percent}%` }}
        />
      </div>
      <p className="text-muted-foreground mt-2 text-xs">{percent}% complete</p>
    </Link>
  );
};

const AttemptRow = ({ attempt }: { attempt: QuizAttempt }) => (
  <div className="border-hairline flex items-center justify-between gap-4 border-b px-4 py-3 text-sm last:border-0">
    <Link
      href={`/dashboard/quizzes/${attempt.quizId}`}
      className="text-ink min-w-0 flex-1 truncate hover:underline"
    >
      {/*
        Attempts carry a quiz id, not a title, and resolving every one would
        mean a request per row. The context is the useful thing to show anyway:
        a practice run and a module exercise are the same score and different
        events.
      */}
      {attempt.contextKind === "standalone"
        ? "Practice quiz"
        : attempt.contextKind === "lesson"
          ? "Quiz lesson"
          : "Module exercise"}
    </Link>
    <span className="text-muted-foreground shrink-0 text-xs">
      {new Date(attempt.startedAt).toLocaleDateString()}
    </span>
    {/*
      A pending attempt shows no percentage at all. Its scorePercent is the
      auto-graded floor, so rendering it beside finished attempts would put a
      number the learner will beat next to numbers they already earned.
    */}
    {attempt.status === "pendingReview" ? (
      <Badge variant="outline" className="shrink-0">
        Being marked
      </Badge>
    ) : (
      <Badge variant={attempt.passed ? "success" : "outline"} className="shrink-0">
        {attempt.scorePercent}%
      </Badge>
    )}
  </div>
);

const EmptyState = ({
  title,
  body,
  href,
  cta,
}: {
  title: string;
  body: string;
  href: string;
  cta: string;
}) => (
  <div className="border-hairline bg-card rounded-xs border px-6 py-10 text-center">
    <p className="font-heading text-ink text-lg">{title}</p>
    <p className="text-muted-foreground mt-1 text-sm">{body}</p>
    <Button asChild size="sm" variant="outline" className="mt-4">
      <Link href={href}>{cta}</Link>
    </Button>
  </div>
);
