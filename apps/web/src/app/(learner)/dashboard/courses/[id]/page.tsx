"use client";

import { useMemo } from "react";
import Link from "next/link";
import { useParams } from "next/navigation";
import { ArrowLeft, CheckCircle2, Circle, FileQuestion, Lock } from "lucide-react";

import { Badge, Button, PageLayout, Skeleton, cn } from "@datarango/ui";

import {
  useCourseProgress,
  useCourseTree,
  useEnroll,
  useMyEnrollments,
  type LessonKind,
} from "@/hooks/learning";

const KIND_LABEL: Record<LessonKind, string> = {
  video: "Video",
  text: "Reading",
  audio: "Audio",
  quiz: "Quiz",
};

export default function CourseDetailPage() {
  const courseId = useParams().id as string;

  const { data: tree, isLoading } = useCourseTree(courseId);
  const { data: enrollments } = useMyEnrollments();

  const enrollment = useMemo(
    () => (enrollments?.enrollments ?? []).find((e) => e.courseId === courseId),
    [enrollments, courseId],
  );
  const isEnrolled = !!enrollment;

  const { data: progress } = useCourseProgress(courseId, isEnrolled);
  const enroll = useEnroll(courseId);

  // Progress arrives per module; lesson-level completion isn't exposed, so the
  // per-module counts drive what the syllabus can honestly show.
  const progressByModule = useMemo(
    () => new Map((progress?.modules ?? []).map((m) => [m.moduleId, m])),
    [progress],
  );

  if (isLoading) {
    return (
      <PageLayout title="Course" subtitle="Loading…">
        <Skeleton skeleton="page" />
      </PageLayout>
    );
  }

  if (!tree) {
    return (
      <PageLayout title="Course not found" subtitle="It may have been unpublished.">
        <Button asChild variant="outline">
          <Link href="/dashboard/courses">Back to courses</Link>
        </Button>
      </PageLayout>
    );
  }

  const lessonCount = tree.modules.reduce((sum, m) => sum + m.lessons.length, 0);

  return (
    <PageLayout
      title={tree.course.title}
      subtitle={tree.course.summary || "No summary yet."}
      actions={[
        isEnrolled ? (
          <Badge key="status" variant={progress?.completed ? "success" : "outline"}>
            {progress?.completed ? "Completed" : `${progress?.percentComplete ?? 0}% complete`}
          </Badge>
        ) : (
          <Button key="enroll" disabled={enroll.isPending} onClick={() => enroll.mutate()}>
            {enroll.isPending ? "Enrolling…" : "Enrol — free"}
          </Button>
        ),
      ]}
    >
      <Link
        href="/dashboard/courses"
        className="text-muted-foreground hover:text-ink inline-flex items-center gap-1 text-sm transition-colors"
      >
        <ArrowLeft className="size-3.5" />
        All courses
      </Link>

      {isEnrolled && progress && !progress.completed && (
        <div className="border-hairline bg-card rounded-xs border p-4">
          <div className="flex items-center justify-between text-sm">
            <span className="font-medium">Your progress</span>
            <span className="text-muted-foreground">{progress.percentComplete}%</span>
          </div>
          <div className="bg-muted mt-2 h-2 rounded-full">
            <div
              className="bg-primary-500 h-2 rounded-full transition-all"
              style={{ width: `${progress.percentComplete}%` }}
            />
          </div>
        </div>
      )}

      {progress?.completed && (
        <div className="border-hairline bg-card rounded-xs border p-4 text-sm">
          <p className="text-ink font-medium">Course complete</p>
          <p className="text-muted-foreground mt-1">
            Your certificate is on your{" "}
            <Link className="text-primary-500 underline-offset-4 hover:underline" href="/dashboard">
              dashboard
            </Link>
            .
          </p>
        </div>
      )}

      <div>
        <div className="mb-3 flex items-baseline justify-between">
          <h2 className="font-heading text-ink text-lg">Syllabus</h2>
          <span className="text-muted-foreground text-sm">
            {tree.modules.length} module{tree.modules.length === 1 ? "" : "s"} · {lessonCount}{" "}
            lesson
            {lessonCount === 1 ? "" : "s"}
          </span>
        </div>

        {tree.modules.length === 0 ? (
          <p className="text-muted-foreground border-hairline bg-card rounded-xs border px-4 py-8 text-center text-sm">
            This course has no published modules yet.
          </p>
        ) : (
          <div className="space-y-3">
            {tree.modules.map((module, index) => {
              const moduleProgress = progressByModule.get(module.id);
              const done = moduleProgress?.completed ?? false;

              return (
                <div className="border-hairline bg-card rounded-xs border" key={module.id}>
                  <div className="border-hairline flex items-center gap-3 border-b px-4 py-3">
                    {done ? (
                      <CheckCircle2 className="size-4 shrink-0 text-emerald-600" />
                    ) : (
                      <Circle className="text-muted-foreground size-4 shrink-0" />
                    )}
                    <span className="text-muted-foreground w-6 shrink-0 text-xs tabular-nums">
                      {String(index + 1).padStart(2, "0")}
                    </span>
                    <h3 className="text-ink min-w-0 flex-1 truncate text-sm font-medium">
                      {module.title}
                    </h3>
                    {moduleProgress && (
                      <span className="text-muted-foreground text-xs">
                        {moduleProgress.lessonsCompleted}/{moduleProgress.lessonsTotal}
                      </span>
                    )}
                  </div>

                  <ul className="px-4 py-2">
                    {module.lessons.map((lesson) => (
                      <li className="flex items-center gap-3 py-1.5 text-sm" key={lesson.id}>
                        <Badge variant="ghost" className="w-16 justify-center">
                          {KIND_LABEL[lesson.kind]}
                        </Badge>
                        <span className="min-w-0 flex-1 truncate">{lesson.title}</span>
                        {isEnrolled ? (
                          <Button asChild size="sm" variant="ghost">
                            <Link href={`/dashboard/courses/${courseId}/lessons/${lesson.id}`}>
                              Open
                            </Link>
                          </Button>
                        ) : (
                          <Lock
                            className="text-muted-foreground size-3.5"
                            aria-label="Enrol to start"
                          />
                        )}
                      </li>
                    ))}

                    <li
                      className={cn(
                        "text-muted-foreground flex items-center gap-3 py-1.5 text-sm",
                        !module.exerciseId && "opacity-60",
                      )}
                    >
                      <Badge variant="outline" className="w-16 justify-center">
                        Exercise
                      </Badge>
                      <span className="flex min-w-0 flex-1 items-center gap-1.5 truncate">
                        <FileQuestion className="size-3.5 shrink-0" />
                        {/* The module gate: lessons alone never complete a module. */}
                        End-of-module exercise
                        {moduleProgress?.exercisePassed && (
                          <span className="text-emerald-600"> · passed</span>
                        )}
                      </span>
                    </li>
                  </ul>
                </div>
              );
            })}
          </div>
        )}
      </div>
    </PageLayout>
  );
}
