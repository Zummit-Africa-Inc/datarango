"use client";

import { CheckCircle2, Circle, FileQuestion, Lock } from "lucide-react";
import { useMemo } from "react";
import Link from "next/link";

import { Badge, Button, cn } from "@datarango/ui";
import { CourseTree, ModuleProgress, ProgressSnapshot, type LessonKind } from "@/hooks/learning";

const KIND_LABEL: Record<LessonKind, string> = {
  video: "Video",
  text: "Reading",
  audio: "Audio",
  quiz: "Quiz",
};

/** Lessons left in a module. Zero when progress hasn't loaded — the exercise link is harmless. */
const lessonsRemaining = (progress: ModuleProgress | undefined) =>
  progress ? progress.lessonsTotal - progress.lessonsCompleted : 0;

interface Props {
  courseId: string;
  isEnrolled: boolean;
  lessonCount: number;
  progress: NoInfer<ProgressSnapshot> | undefined;
  tree: NoInfer<CourseTree>;
}

export const Syllabus = ({ courseId, isEnrolled, lessonCount, progress, tree }: Props) => {
  const progressByModule = useMemo(
    () => new Map((progress?.modules ?? []).map((m) => [m.moduleId, m])),
    [progress],
  );
  // Lesson-level completion, which the snapshot now carries. Before it did, this
  // list could only show per-module counts and the exercise row was a label with
  // nothing behind it.
  const completedLessonIds = useMemo(
    () => new Set((progress?.modules ?? []).flatMap((m) => m.completedLessonIds)),
    [progress],
  );
  return (
    <div>
      <div className="mb-3 flex items-baseline justify-between">
        <h2 className="font-heading text-ink text-lg">Syllabus</h2>
        <span className="text-muted-foreground text-sm">
          {tree.modules.length} module{tree.modules.length === 1 ? "" : "s"} · {lessonCount} lesson
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
                  {module.lessons.map((lesson) => {
                    const lessonDone = completedLessonIds.has(lesson.id);
                    return (
                      <li className="flex items-center gap-3 py-1.5 text-sm" key={lesson.id}>
                        {isEnrolled ? (
                          lessonDone ? (
                            <CheckCircle2
                              className="size-3.5 shrink-0 text-emerald-600"
                              aria-label="Completed"
                            />
                          ) : (
                            <Circle className="text-muted-foreground size-3.5 shrink-0" />
                          )
                        ) : (
                          // Not a hollow circle for a guest: an empty tick reads
                          // as "not done yet", which is a claim about a learner
                          // who has not started the course at all.
                          <span className="size-3.5 shrink-0" />
                        )}
                        <Badge variant="ghost" className="w-16 justify-center">
                          {KIND_LABEL[lesson.kind]}
                        </Badge>
                        <span
                          className={cn(
                            "min-w-0 flex-1 truncate",
                            lessonDone && "text-muted-foreground",
                          )}
                        >
                          {lesson.title}
                        </span>
                        {isEnrolled ? (
                          <Button asChild size="sm" variant="ghost">
                            <Link href={`/dashboard/courses/${courseId}/lessons/${lesson.id}`}>
                              {lessonDone ? "Review" : "Open"}
                            </Link>
                          </Button>
                        ) : (
                          <Lock
                            className="text-muted-foreground size-3.5"
                            aria-label="Enrol to start"
                          />
                        )}
                      </li>
                    );
                  })}
                  {/* This row used to be a dead label. The exercise is the only
                      thing standing between a finished set of lessons and a
                      completed module, so it needs the same affordance the
                      lessons have — and it says why when it isn't takeable yet
                      rather than looking like an oversight. */}
                  <li
                    className={cn(
                      "text-muted-foreground flex items-center gap-3 py-1.5 text-sm",
                      !module.exerciseId && "opacity-60",
                    )}
                  >
                    {isEnrolled && moduleProgress?.exercisePassed ? (
                      <CheckCircle2
                        className="size-3.5 shrink-0 text-emerald-600"
                        aria-label="Passed"
                      />
                    ) : isEnrolled ? (
                      <Circle className="text-muted-foreground size-3.5 shrink-0" />
                    ) : (
                      <span className="size-3.5 shrink-0" />
                    )}
                    <Badge variant="outline" className="w-16 justify-center">
                      Exercise
                    </Badge>
                    <span className="flex min-w-0 flex-1 items-center gap-1.5 truncate">
                      <FileQuestion className="size-3.5 shrink-0" />
                      End-of-module exercise
                    </span>
                    {isEnrolled && module.exerciseId ? (
                      lessonsRemaining(moduleProgress) > 0 ? (
                        <span className="shrink-0 text-xs">
                          {lessonsRemaining(moduleProgress)} lesson
                          {lessonsRemaining(moduleProgress) === 1 ? "" : "s"} to go
                        </span>
                      ) : (
                        <Button asChild size="sm" variant="ghost">
                          <Link
                            href={`/dashboard/courses/${courseId}/modules/${module.id}/exercise`}
                          >
                            {moduleProgress?.exercisePassed ? "Review" : "Take it"}
                          </Link>
                        </Button>
                      )
                    ) : (
                      !isEnrolled && (
                        <Lock className="size-3.5 shrink-0" aria-label="Enrol to start" />
                      )
                    )}
                  </li>
                </ul>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
};
