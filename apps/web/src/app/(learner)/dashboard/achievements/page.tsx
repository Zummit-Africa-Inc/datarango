"use client";

import { useMemo } from "react";
import Link from "next/link";
import { Award, BadgeCheck, ListChecks, Trophy } from "lucide-react";

import { Badge, Button, PageLayout, Skeleton, Statistics } from "@datarango/ui";

import { useDiscoverQuizzes, useMyAttempts } from "@/hooks/assessment";
import { useMyCertificates, useMyEnrollments } from "@/hooks/learning";

/**
 * Achievements.
 *
 * There is no badge service: `datarango-economy`'s gamification module has no
 * subjects and no routes, so streaks, badges and points have nothing behind
 * them and inventing some here would be a fiction rendered as a record.
 *
 * But the learner has genuinely achieved things, and those are already recorded
 * elsewhere — issued certificates, and passed quiz attempts, both user-owned and
 * both real. So this page assembles what the platform can actually attest to
 * rather than sitting empty until Phase 5.
 *
 * A passed attempt is counted per QUIZ, not per attempt: passing the same quiz
 * three times is one achievement and three attempts, and the distinction is the
 * difference between a record and a score.
 */
export default function AchievementsPage() {
  const { data: certificates, isLoading: loadingCerts } = useMyCertificates();
  const { data: attempts, isLoading: loadingAttempts } = useMyAttempts();
  const { data: enrollments } = useMyEnrollments();

  // Attempts carry a quizId and no title, so on their own they render as
  // "Passed 25/08/2026" — a list of achievements with nothing achieved in it.
  // The library is the only place a learner-readable title lives, so it is
  // joined in here.
  const { data: library } = useDiscoverQuizzes({ pageSize: 100 });
  const titleByQuiz = useMemo(
    () => new Map((library?.quizzes ?? []).map((q) => [q.quizId, q.title])),
    [library],
  );

  const passedQuizzes = useMemo(() => {
    const byQuiz = new Map<string, { quizId: string; at: string; contextKind: string }>();
    for (const attempt of attempts?.attempts ?? []) {
      // `pendingReview` has no verdict yet, so `passed: false` there is the
      // absence of a decision rather than a failure — either way it is not an
      // achievement, and only a real pass counts.
      if (attempt.status !== "graded" || !attempt.passed) continue;
      const existing = byQuiz.get(attempt.quizId);
      const at = attempt.submittedAt ?? attempt.startedAt;
      if (!existing || at < existing.at) {
        byQuiz.set(attempt.quizId, {
          quizId: attempt.quizId,
          at,
          contextKind: attempt.contextKind,
        });
      }
    }
    return [...byQuiz.values()].sort((a, b) => b.at.localeCompare(a.at));
  }, [attempts]);

  const issued = certificates?.certificates ?? [];
  const loading = loadingCerts || loadingAttempts;

  return (
    <PageLayout
      title="Achievements"
      subtitle="What you've actually finished, and what it's on record for."
    >
      {loading ? (
        <Skeleton skeleton="page" />
      ) : (
        <>
          <div className="grid grid-cols-2 gap-3 lg:grid-cols-4">
            <Statistics
              label="Certificates"
              value={String(issued.length)}
              icon={BadgeCheck}
              description={issued.length > 0 ? "Publicly verifiable" : undefined}
            />
            <Statistics
              label="Quizzes passed"
              value={String(passedQuizzes.length)}
              icon={ListChecks}
            />
            <Statistics
              label="Courses enrolled"
              value={String(enrollments?.enrollments.length ?? 0)}
              icon={Trophy}
            />
            <Statistics label="Badges" value="—" icon={Award} description="Not available yet" />
          </div>

          <div className="border-hairline bg-muted/40 rounded-xs border px-4 py-3 text-sm">
            <p className="text-ink font-medium">Badges and streaks aren&apos;t live yet</p>
            <p className="text-muted-foreground mt-1">
              Everything on this page is a real record the platform can attest to. Badges, points
              and streaks arrive with the token economy — nothing here is a placeholder standing in
              for one.
            </p>
          </div>

          <section>
            <h2 className="font-heading text-ink mb-3 text-lg">Certificates</h2>
            {issued.length === 0 ? (
              <p className="text-muted-foreground border-hairline bg-card rounded-xs border px-4 py-8 text-center text-sm">
                Complete every module of a course — lessons and end-of-module exercises — and a
                certificate is issued automatically.
              </p>
            ) : (
              <ul className="border-hairline bg-card rounded-xs border">
                {issued.map((certificate) => (
                  <li
                    className="border-hairline flex flex-wrap items-center gap-3 border-b px-4 py-3 text-sm last:border-b-0"
                    key={certificate.id}
                  >
                    <BadgeCheck className="size-4 shrink-0 text-emerald-600" />
                    <span className="text-ink min-w-0 flex-1 truncate font-medium">
                      {certificate.courseTitle}
                    </span>
                    <code className="text-muted-foreground font-code shrink-0 text-xs">
                      {certificate.serial}
                    </code>
                    <Button asChild size="sm" variant="ghost">
                      {/* The public verification page — the serial is the whole
                          capability, which is why it is safe to link. */}
                      <Link href={`/verify/${certificate.serial}`}>Verify</Link>
                    </Button>
                  </li>
                ))}
              </ul>
            )}
          </section>

          <section>
            <h2 className="font-heading text-ink mb-3 text-lg">Quizzes passed</h2>
            {passedQuizzes.length === 0 ? (
              <p className="text-muted-foreground border-hairline bg-card rounded-xs border px-4 py-8 text-center text-sm">
                Nothing passed yet.{" "}
                <Link
                  className="text-primary-500 underline-offset-4 hover:underline"
                  href="/dashboard/quizzes"
                >
                  Browse the quiz library
                </Link>
                .
              </p>
            ) : (
              <ul className="border-hairline bg-card rounded-xs border">
                {passedQuizzes.map((quiz) => (
                  <li
                    className="border-hairline flex flex-wrap items-center gap-3 border-b px-4 py-3 text-sm last:border-b-0"
                    key={quiz.quizId}
                  >
                    <ListChecks className="size-4 shrink-0 text-emerald-600" />
                    <span className="min-w-0 flex-1 truncate">
                      {/* A quiz that has since been unpublished won't be in the
                          library, so the date still carries the row rather than
                          leaving it blank. */}
                      <span className="text-ink block truncate font-medium">
                        {titleByQuiz.get(quiz.quizId) ?? "A quiz you passed"}
                      </span>
                      <span className="text-muted-foreground block truncate text-xs">
                        Passed {new Date(quiz.at).toLocaleDateString()}
                      </span>
                    </span>
                    {/* A standalone pass and a module-exercise pass look
                        identical by score and mean different things — one
                        advanced a course, the other deliberately did not. */}
                    <Badge variant="outline">
                      {quiz.contextKind === "standalone"
                        ? "Standalone"
                        : quiz.contextKind === "moduleExercise"
                          ? "Module exercise"
                          : "In a lesson"}
                    </Badge>
                    <Button asChild size="sm" variant="ghost">
                      <Link href={`/dashboard/quizzes/${quiz.quizId}`}>Open</Link>
                    </Button>
                  </li>
                ))}
              </ul>
            )}
          </section>
        </>
      )}
    </PageLayout>
  );
}
