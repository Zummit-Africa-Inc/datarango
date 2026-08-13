"use client";

import { CheckCircle2, Circle, FileQuestion, Lock } from "lucide-react";
import { useMemo } from "react";
import Link from "next/link";

import { Badge, Button, cn } from "@datarango/ui";
import { CourseTree, ProgressSnapshot, type LessonKind } from "@/hooks/learning";

const KIND_LABEL: Record<LessonKind, string> = {
  video: "Video",
  text: "Reading",
  audio: "Audio",
  quiz: "Quiz",
};

interface Props {
  courseId: string;
  isEnrolled: boolean;
  lessonCount: number;
  progress: NoInfer<ProgressSnapshot> | undefined;
  tree: NoInfer<CourseTree>;
}

export const Syllabus = ({ courseId, isEnrolled, lessonCount, progress, tree }: Props) => {
  // Progress arrives per module; lesson-level completion isn't exposed, so the
  // per-module counts drive what the syllabus can honestly show.
  const progressByModule = useMemo(
    () => new Map((progress?.modules ?? []).map((m) => [m.moduleId, m])),
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
  );
};
