"use client";

import {
  ArrowRight,
  Award,
  BookOpenCheck,
  CalendarClock,
  CheckCircle2,
  FileBadge,
  Flame,
  ListChecks,
  Play,
  Trophy,
} from "lucide-react";
import { useMemo } from "react";
import Link from "next/link";

import {
  Badge,
  Button,
  CatalogueThumbnail,
  EmptyState,
  ProgressBar,
  ProgressRing,
  Shimmer,
  StatCard,
  UserAvatar,
  cn,
} from "@datarango/ui";

import { CourseCard } from "@/components/learning/course-card";
import { useDiscoverCompetitions } from "@/hooks/arena";
import { useMyAttempts, type QuizAttempt } from "@/hooks/assessment";
import { useBadges, useLeaderboard, useStanding } from "@/hooks/economy";
import {
  useCourseProgress,
  useCourseTree,
  useDiscoverCourses,
  useMyCertificates,
  useMyEnrollments,
  type Enrollment,
} from "@/hooks/learning";

const RECOMMENDED = 4;
const RECENT_ATTEMPTS = 5;

/** Learner home (§7.2). Every number on it comes from a service; nothing is placeholder data. */
export default function DashboardPage() {
  const { data: enrolled, isLoading: enrollmentsLoading } = useMyEnrollments();
  const { data: certificates } = useMyCertificates();
  const { data: attempts } = useMyAttempts();
  const { data: standing } = useStanding();
  // One discovery read serves both the recommendations and the enrolled-id
  // check; a per-course lookup would be an N+1 on the landing page.
  const { data: catalogue } = useDiscoverCourses({ pageSize: 24 });

  const enrollments = useMemo(() => enrolled?.enrollments ?? [], [enrolled]);
  const enrolledIds = useMemo(() => new Set(enrollments.map((e) => e.courseId)), [enrollments]);
  const inProgress = useMemo(
    () =>
      enrollments
        .filter((e) => e.completedAt === null)
        .sort((a, b) => b.createdAt.localeCompare(a.createdAt)),
    [enrollments],
  );
  const recommended = useMemo(
    () => (catalogue?.courses ?? []).filter((c) => !enrolledIds.has(c.id)).slice(0, RECOMMENDED),
    [catalogue, enrolledIds],
  );
  const attemptList = attempts?.attempts ?? [];
  const [current, ...others] = inProgress;

  return (
    <div className="grid gap-6 xl:grid-cols-[minmax(0,1fr)_20rem]">
      <div className="min-w-0 space-y-6">
        {standing && (
          <div className="flex flex-wrap items-center gap-2">
            <span className="bg-rose-soft text-rose-soft-foreground inline-flex h-8 items-center gap-1.5 rounded-full px-3 text-sm font-semibold">
              <Flame aria-hidden="true" className="size-4" />
              {standing.currentStreak > 0
                ? `${standing.currentStreak}-day streak`
                : "Start a streak today"}
            </span>
            <span className="bg-violet-soft text-violet-soft-foreground inline-flex h-8 items-center gap-2 rounded-full px-3 text-sm font-semibold">
              Level {standing.level}
              <ProgressBar
                value={(standing.xpIntoLevel / Math.max(1, standing.xpForLevel)) * 100}
                accent="violet"
                size="sm"
                label={`${standing.xpIntoLevel} of ${standing.xpForLevel} XP to level ${standing.level + 1}`}
                className="w-20"
              />
            </span>
          </div>
        )}

        {enrollmentsLoading ? (
          <Shimmer className="h-48 rounded-lg" />
        ) : current ? (
          <ContinueHero enrollment={current} />
        ) : (
          <EmptyState
            icon={BookOpenCheck}
            accent="lime"
            title={
              enrollments.length > 0
                ? "You've finished everything you started"
                : "You're not enrolled in anything yet"
            }
            hint={
              enrollments.length > 0
                ? "Browse the catalogue for something new."
                : "Find a course and enrol. Your progress will show up here."
            }
            action={
              <Button asChild size="sm">
                <Link href="/dashboard/courses">Browse courses</Link>
              </Button>
            }
          />
        )}

        <div className="grid gap-4 sm:grid-cols-2 2xl:grid-cols-4">
          <StatCard
            label="Lessons completed"
            value={standing?.lessonsCompleted ?? "–"}
            icon={BookOpenCheck}
            accent="sky"
          />
          <StatCard
            label="Quizzes passed"
            value={standing?.quizzesPassed ?? "–"}
            icon={ListChecks}
            accent="amber"
          />
          <StatCard
            label="Courses completed"
            value={standing?.coursesCompleted ?? "–"}
            icon={CheckCircle2}
            accent="lime"
          />
          <StatCard
            label="Certificates"
            value={certificates?.certificates.length ?? "–"}
            icon={FileBadge}
            accent="violet"
          />
        </div>

        <div className={cn("grid gap-6", current && "lg:grid-cols-2")}>
          {current && (
            <Section title="Also in progress" href="/dashboard/my-courses" link="My courses">
              {others.length === 0 ? (
                <p className="text-foreground-muted border-border rounded-lg border border-dashed px-4 py-8 text-center text-sm">
                  Just the one course on the go.
                </p>
              ) : (
                <ul className="border-border bg-card divide-border divide-y overflow-hidden rounded-lg border">
                  {others.slice(0, 4).map((enrollment) => (
                    <ProgressRow key={enrollment.id} enrollment={enrollment} />
                  ))}
                </ul>
              )}
            </Section>
          )}
          <Upcoming />
        </div>

        {recommended.length > 0 && (
          <Section title="Recommended for you" href="/dashboard/courses" link="All courses">
            <ul className="grid gap-5 sm:grid-cols-2 2xl:grid-cols-4">
              {recommended.map((course) => (
                <li key={course.id}>
                  <CourseCard course={course} enrolled={false} />
                </li>
              ))}
            </ul>
          </Section>
        )}

        <Section title="Recent quiz attempts" href="/dashboard/quizzes" link="Quiz library">
          {attemptList.length === 0 ? (
            <EmptyState
              icon={ListChecks}
              accent="amber"
              title="No attempts yet"
              hint="Practise with quizzes from the library, or take one inside a course."
              action={
                <Button asChild size="sm" variant="outline">
                  <Link href="/dashboard/quizzes">Browse quizzes</Link>
                </Button>
              }
            />
          ) : (
            <ul className="border-border bg-card divide-border divide-y overflow-hidden rounded-lg border">
              {attemptList.slice(0, RECENT_ATTEMPTS).map((attempt) => (
                <AttemptRow key={attempt.id} attempt={attempt} />
              ))}
            </ul>
          )}
        </Section>
      </div>

      {/* The rail stays in view while the main column scrolls (the shell scrolls <main>; its padding already sets the gap). */}
      <aside className="space-y-6 xl:sticky xl:top-0 xl:self-start">
        <Leaderboard />
        <RecentBadges />
      </aside>
    </div>
  );
}

const Section = ({
  title,
  href,
  link,
  children,
}: {
  title: string;
  href: string;
  link: string;
  children: React.ReactNode;
}) => (
  <section className="space-y-3">
    <div className="flex items-center justify-between gap-3">
      <h2 className="font-display text-foreground text-lg font-semibold">{title}</h2>
      <Button asChild size="sm" variant="ghost">
        <Link href={href}>
          {link} <ArrowRight className="size-4" />
        </Link>
      </Button>
    </div>
    {children}
  </section>
);

/**
 * The most recent in-progress course, with the next unfinished lesson. The
 * tree gives title, cover and lesson order; the progress snapshot says which
 * lessons are done.
 */
const ContinueHero = ({ enrollment }: { enrollment: Enrollment }) => {
  const { data: tree } = useCourseTree(enrollment.courseId);
  const { data: progress } = useCourseProgress(enrollment.courseId, true);
  const percent = progress?.percentComplete ?? 0;

  const nextLesson = useMemo(() => {
    if (!tree) return undefined;
    const done = new Set((progress?.modules ?? []).flatMap((m) => m.completedLessonIds));
    return tree.modules
      .flatMap((m) => [...m.lessons].sort((a, b) => a.position - b.position))
      .find((lesson) => !done.has(lesson.id));
  }, [tree, progress]);

  const title = tree?.course.title ?? "Your course";
  const href = `/dashboard/courses/${enrollment.courseId}`;

  return (
    <section
      aria-label="Continue learning"
      className="border-border bg-primary-soft relative overflow-hidden rounded-lg border p-5 sm:p-6"
    >
      <div className="flex flex-col gap-5 sm:flex-row sm:items-center">
        <CatalogueThumbnail
          id={enrollment.courseId}
          title={title}
          imageUrl={tree?.course.imageUrl}
          className="w-full shrink-0 rounded-md sm:w-44"
        />
        <div className="min-w-0 flex-1">
          <p className="text-primary-soft-foreground text-xs font-semibold tracking-[0.06em] uppercase">
            Continue learning
          </p>
          <h2 className="font-display text-foreground mt-1 line-clamp-2 text-2xl leading-tight font-semibold">
            {title}
          </h2>
          <p className="text-foreground-muted mt-1 truncate text-sm">
            {nextLesson ? (
              <>
                Next: <span className="text-foreground font-medium">{nextLesson.title}</span>
              </>
            ) : enrollment.grantedByOrgId ? (
              "Assigned by your organisation"
            ) : (
              "Pick up where you left off"
            )}
          </p>
          <Button asChild className="mt-4">
            <Link href={href}>
              <Play className="size-4" />
              Resume
            </Link>
          </Button>
        </div>
        <ProgressRing
          value={percent}
          size={96}
          accent="lime"
          label={`${percent}% complete`}
          showValue
          className="hidden shrink-0 sm:block"
        />
      </div>
    </section>
  );
};

const ProgressRow = ({ enrollment }: { enrollment: Enrollment }) => {
  const { data: tree } = useCourseTree(enrollment.courseId);
  const { data: progress } = useCourseProgress(enrollment.courseId, true);
  const percent = progress?.percentComplete ?? 0;
  const title = tree?.course.title ?? "Untitled course";

  return (
    <li>
      <Link
        href={`/dashboard/courses/${enrollment.courseId}`}
        className="hover:bg-muted/60 flex items-center gap-3 px-4 py-3 transition-colors"
      >
        <CatalogueThumbnail
          id={enrollment.courseId}
          title={title}
          imageUrl={tree?.course.imageUrl}
          className="w-14 shrink-0 rounded-sm"
        />
        <div className="min-w-0 flex-1">
          <p className="text-foreground truncate text-sm font-medium">{title}</p>
          <ProgressBar value={percent} size="sm" label={`${percent}% complete`} className="mt-2" />
        </div>
        <span className="text-foreground-muted w-10 shrink-0 text-right text-xs tabular-nums">
          {percent}%
        </span>
      </Link>
    </li>
  );
};

const dayFormat = new Intl.DateTimeFormat("en-GB", { day: "numeric", month: "short" });

/** Open competitions by closing date, soonest first. Deadlines and live sessions arrive when those exist. */
const Upcoming = () => {
  // Live and soonest-ending first, from the API (one page of 20 sorted
  // client-side missed deadlines on later pages).
  const { data } = useDiscoverCompetitions({ status: "live", sort: "endingSoon", pageSize: 8 });
  const closing = useMemo(
    () => (data?.competitions ?? []).filter((c) => c.endsAt).slice(0, 4),
    [data],
  );

  return (
    <Section title="Upcoming" href="/dashboard/competitions" link="Competitions">
      {closing.length === 0 ? (
        <p className="text-foreground-muted border-border rounded-lg border border-dashed px-4 py-8 text-center text-sm">
          No deadlines coming up.
        </p>
      ) : (
        <ul className="border-border bg-card divide-border divide-y overflow-hidden rounded-lg border">
          {closing.map((competition) => (
            <li key={competition.id}>
              <Link
                href={`/dashboard/competitions/${competition.id}`}
                className="hover:bg-muted/60 flex items-center gap-3 px-4 py-3 transition-colors"
              >
                <span className="bg-rose-soft text-rose-soft-foreground grid size-10 shrink-0 place-items-center rounded-md">
                  <Trophy aria-hidden="true" className="size-5" />
                </span>
                <span className="min-w-0 flex-1">
                  <span className="text-foreground block truncate text-sm font-medium">
                    {competition.title}
                  </span>
                  <span className="text-foreground-muted flex items-center gap-1 text-xs">
                    <CalendarClock aria-hidden="true" className="size-3.5" />
                    Closes {dayFormat.format(new Date(competition.endsAt!))}
                  </span>
                </span>
              </Link>
            </li>
          ))}
        </ul>
      )}
    </Section>
  );
};

const Leaderboard = () => {
  const { data } = useLeaderboard(5);
  const players = data?.players ?? [];

  return (
    <section className="border-border bg-card rounded-lg border p-4">
      <div className="mb-3 flex items-center justify-between">
        <h2 className="font-display text-foreground font-semibold">Leaderboard</h2>
        <span className="text-foreground-subtle text-xs">by XP</span>
      </div>
      {players.length === 0 ? (
        <p className="text-foreground-muted py-4 text-center text-sm">No rankings yet.</p>
      ) : (
        <ol className="space-y-1">
          {players.map((player) => (
            <li
              key={player.userId}
              className={cn(
                "flex items-center gap-3 rounded-md px-2 py-2",
                player.isYou && "bg-primary-soft",
              )}
            >
              <span className="text-foreground-subtle w-5 text-center font-mono text-xs">
                {player.rank}
              </span>
              <UserAvatar name={player.displayName} size="sm" />
              <span className="text-foreground min-w-0 flex-1 truncate text-sm font-medium">
                {player.displayName}
                {player.isYou && <span className="text-foreground-muted font-normal"> (you)</span>}
              </span>
              <span className="text-foreground-muted font-mono text-xs tabular-nums">
                {player.xp.toLocaleString("en-GB")}
              </span>
            </li>
          ))}
        </ol>
      )}
    </section>
  );
};

const RecentBadges = () => {
  const { data } = useBadges();
  const earned = useMemo(
    () =>
      (data?.badges ?? [])
        .filter((b) => b.earnedAt)
        .sort((a, b) => b.earnedAt!.localeCompare(a.earnedAt!))
        .slice(0, 4),
    [data],
  );

  return (
    <section className="border-border bg-card rounded-lg border p-4">
      <div className="mb-3 flex items-center justify-between">
        <h2 className="font-display text-foreground font-semibold">Recent badges</h2>
        <Link
          href="/dashboard/achievements"
          className="text-primary text-xs font-medium hover:underline"
        >
          All {data ? `(${data.earned})` : ""}
        </Link>
      </div>
      {earned.length === 0 ? (
        <p className="text-foreground-muted py-4 text-center text-sm">
          Finish a lesson to earn your first badge.
        </p>
      ) : (
        <ul className="grid grid-cols-2 gap-2">
          {earned.map((badge) => (
            <li
              key={badge.id}
              title={badge.description}
              className="bg-amber-soft text-amber-soft-foreground flex flex-col items-center gap-1 rounded-md px-2 py-3 text-center"
            >
              <Award aria-hidden="true" className="size-6" />
              <span className="line-clamp-2 text-xs font-semibold">{badge.name}</span>
            </li>
          ))}
        </ul>
      )}
    </section>
  );
};

const AttemptRow = ({ attempt }: { attempt: QuizAttempt }) => (
  <li className="flex items-center justify-between gap-4 px-4 py-3 text-sm">
    <Link
      href={`/dashboard/quizzes/${attempt.quizId}`}
      className="text-foreground min-w-0 flex-1 truncate hover:underline"
    >
      {/* Attempts carry a quiz id, not a title; the context is the useful thing to show anyway. */}
      {attempt.contextKind === "standalone"
        ? "Practice quiz"
        : attempt.contextKind === "lesson"
          ? "Quiz lesson"
          : "Module exercise"}
    </Link>
    <span className="text-foreground-muted shrink-0 text-xs">
      {dayFormat.format(new Date(attempt.startedAt))}
    </span>
    {/* A pending attempt's score is only the auto-graded floor, so it shows a status instead. */}
    {attempt.status === "pendingReview" ? (
      <Badge appearance="outline" className="shrink-0">
        Being marked
      </Badge>
    ) : attempt.status === "pendingAutoGrade" ? (
      <Badge appearance="outline" className="shrink-0">
        Running tests
      </Badge>
    ) : (
      <Badge
        tone={attempt.passed ? "success" : "neutral"}
        appearance="soft"
        className="shrink-0 tabular-nums"
      >
        {attempt.scorePercent}%
      </Badge>
    )}
  </li>
);
