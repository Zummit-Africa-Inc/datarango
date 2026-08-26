"use client";

import { useParams, useRouter } from "next/navigation";
import { useMemo } from "react";
import Link from "next/link";
import { ArrowLeft, CheckCircle2, Lock } from "lucide-react";

import { Badge, Button, PageLayout, Skeleton } from "@datarango/ui";

import { QuizRunner } from "@/components/learning/quiz-runner";
import { useCourseProgress, useCourseTree, useMyEnrollments } from "@/hooks/learning";

/**
 * The end-of-module exercise.
 *
 * This route did not exist. The syllabus listed an "End-of-module exercise" row
 * with nothing behind it, so the one thing standing between a learner and
 * finishing a module — and therefore between them and a certificate — was
 * unreachable in the product. `moduleExercise` has been a first-class attempt
 * context in the API and the quiz runner all along; nothing drove it.
 *
 * The gate is the module's own completion rule, mirrored here so the learner is
 * told why rather than being handed a quiz that would not count: a module
 * completes only when every lesson is done AND this is passed. The server
 * re-checks; this exists so the answer arrives before the work, not after it.
 */
export default function ModuleExercisePage() {
  const params = useParams<{ id: string; moduleId: string }>();
  const router = useRouter();
  const courseId = params.id;
  const moduleId = params.moduleId;

  const { data: tree, isLoading } = useCourseTree(courseId);
  const { data: enrollments } = useMyEnrollments();

  const enrollment = useMemo(
    () => (enrollments?.enrollments ?? []).find((e) => e.courseId === courseId),
    [enrollments, courseId],
  );
  const { data: progress } = useCourseProgress(courseId, !!enrollment);

  const courseModule = tree?.modules.find((m) => m.id === moduleId);
  const moduleProgress = progress?.modules.find((m) => m.moduleId === moduleId);
  const lessonsDone =
    !!moduleProgress && moduleProgress.lessonsCompleted === moduleProgress.lessonsTotal;
  const remaining = moduleProgress
    ? moduleProgress.lessonsTotal - moduleProgress.lessonsCompleted
    : 0;

  const backToCourse = (
    <Button asChild variant="outline">
      <Link href={`/dashboard/courses/${courseId}`}>Back to the course</Link>
    </Button>
  );

  if (isLoading) {
    return (
      <PageLayout title="Exercise" subtitle="Loading…">
        <Skeleton skeleton="page" />
      </PageLayout>
    );
  }

  if (!tree || !courseModule) {
    return (
      <PageLayout title="Exercise not found" subtitle="It may have moved to a new course version.">
        {backToCourse}
      </PageLayout>
    );
  }

  if (!enrollment) {
    return (
      <PageLayout title={courseModule.title} subtitle="Enrol to take this exercise.">
        {backToCourse}
      </PageLayout>
    );
  }

  // A published module always has one — the publish invariant requires it — so
  // this is the unpublished-draft case rather than something a learner can hit.
  if (!courseModule.exerciseId) {
    return (
      <PageLayout title={courseModule.title} subtitle="This module has no exercise yet.">
        {backToCourse}
      </PageLayout>
    );
  }

  const firstUnfinished = courseModule.lessons.find(
    (lesson) => !moduleProgress?.completedLessonIds.includes(lesson.id),
  );

  return (
    <PageLayout
      title={`${courseModule.title} — exercise`}
      subtitle="Pass this to complete the module."
      actions={[
        moduleProgress?.exercisePassed ? (
          <Badge key="passed" variant="success">
            Passed
          </Badge>
        ) : (
          <Badge key="lessons" variant="outline">
            {moduleProgress?.lessonsCompleted ?? 0}/{moduleProgress?.lessonsTotal ?? 0} lessons done
          </Badge>
        ),
      ]}
    >
      <Link
        href={`/dashboard/courses/${courseId}`}
        className="text-muted-foreground hover:text-ink inline-flex items-center gap-1 text-sm transition-colors"
      >
        <ArrowLeft className="size-3.5" />
        Course overview
      </Link>

      {moduleProgress?.exercisePassed && (
        <div className="border-hairline bg-card flex items-start gap-3 rounded-xs border p-4 text-sm">
          <CheckCircle2 className="mt-0.5 size-4 shrink-0 text-emerald-600" />
          <div>
            <p className="text-ink font-medium">You&apos;ve already passed this exercise</p>
            <p className="text-muted-foreground mt-1">
              Retaking it can&apos;t take the pass away — the module stays complete either way.
            </p>
          </div>
        </div>
      )}

      {!lessonsDone ? (
        // Said before the quiz rather than after it: an attempt taken now still
        // costs an attempt against the limit, and would not complete the module.
        <div className="border-hairline bg-card rounded-xs border px-6 py-12 text-center">
          <Lock className="text-muted-foreground mx-auto size-8" strokeWidth={1.5} />
          <p className="font-heading text-ink mt-3 text-lg">Finish the lessons first</p>
          <p className="text-muted-foreground mx-auto mt-1 max-w-prose text-sm">
            A module completes only when every lesson is done <em>and</em> this exercise is passed.
            {remaining > 0 && (
              <>
                {" "}
                {remaining} lesson{remaining === 1 ? "" : "s"} to go in this module.
              </>
            )}
          </p>
          {firstUnfinished && (
            <Button asChild className="mt-4">
              <Link href={`/dashboard/courses/${courseId}/lessons/${firstUnfinished.id}`}>
                Go to {firstUnfinished.title}
              </Link>
            </Button>
          )}
        </div>
      ) : (
        <QuizRunner
          quizId={courseModule.exerciseId}
          context="moduleExercise"
          courseId={courseId}
          courseVersionId={enrollment.courseVersionId}
          moduleId={moduleId}
          // Back to the course on a pass, where the newly completed module — and
          // a certificate, if that was the last one — is what they want to see.
          onCompleted={(result) => {
            if (result.passed) router.push(`/dashboard/courses/${courseId}`);
          }}
        />
      )}
    </PageLayout>
  );
}
