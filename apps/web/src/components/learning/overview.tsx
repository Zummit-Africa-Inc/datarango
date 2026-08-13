"use client";

import { BookOpen, Clapperboard, FileQuestion, FileText, Play, Volume2 } from "lucide-react";
import { useMemo } from "react";
import Link from "next/link";

import { Button, Statistics } from "@datarango/ui";
import { CourseTree, ProgressSnapshot, type LessonKind } from "@/hooks/learning";

const KIND_META: Record<LessonKind, { label: string; plural: string; icon: typeof FileText }> = {
  video: { label: "video", plural: "videos", icon: Clapperboard },
  text: { label: "reading", plural: "readings", icon: FileText },
  audio: { label: "audio lesson", plural: "audio lessons", icon: Volume2 },
  quiz: { label: "quiz", plural: "quizzes", icon: FileQuestion },
};

// Order the breakdown reads in, rather than whatever order the kinds happen to
// appear in the course.
const KIND_ORDER: LessonKind[] = ["video", "text", "audio", "quiz"];

interface Props {
  courseId: string;
  isEnrolled: boolean;
  progress: NoInfer<ProgressSnapshot> | undefined;
  tree: NoInfer<CourseTree>;
}

export const Overview = ({ courseId, isEnrolled, progress, tree }: Props) => {
  // Same flattening the lesson player uses, so "continue" lands on the lesson
  // its own next/previous navigation would agree with.
  const ordered = useMemo(() => tree.modules.flatMap((mod) => mod.lessons), [tree]);

  const kindCounts = useMemo(() => {
    const counts = new Map<LessonKind, number>();
    for (const lesson of ordered) counts.set(lesson.kind, (counts.get(lesson.kind) ?? 0) + 1);
    return counts;
  }, [ordered]);

  const exerciseCount = tree.modules.filter((mod) => mod.exerciseId).length;

  /**
   * Where to send someone who presses Continue.
   *
   * Progress is reported per module — `lessonsCompleted` counts, but *which*
   * lessons are done is not exposed — so this is a position, not a bookmark:
   * the first module that isn't finished, offset by however many of its lessons
   * are complete. That matches the syllabus, which is under the same
   * constraint. It can only be wrong if lessons were completed out of order,
   * and it lands on a valid lesson in the right module either way.
   */
  const resumeLesson = useMemo(() => {
    if (!progress) return ordered[0];

    for (const mod of tree.modules) {
      const moduleProgress = progress.modules.find((m) => m.moduleId === mod.id);
      if (moduleProgress?.completed) continue;
      return mod.lessons[moduleProgress?.lessonsCompleted ?? 0] ?? mod.lessons[0];
    }
    // Every module complete — offer the start rather than nothing, so the page
    // still has somewhere to go for a re-read.
    return ordered[0];
  }, [ordered, progress, tree]);

  const started = (progress?.percentComplete ?? 0) > 0;

  return (
    <div className="space-y-4">
      {isEnrolled && resumeLesson && (
        <div className="border-hairline bg-card flex flex-wrap items-center justify-between gap-3 rounded-xs border p-4">
          <div className="min-w-0">
            <p className="text-ink text-sm font-medium">
              {progress?.completed
                ? "Revisit the course"
                : started
                  ? "Pick up where you stopped"
                  : "Ready when you are"}
            </p>
            <p className="text-muted-foreground mt-1 truncate text-sm">{resumeLesson.title}</p>
          </div>
          <Button asChild>
            <Link href={`/dashboard/courses/${courseId}/lessons/${resumeLesson.id}`}>
              <Play className="size-3.5" />
              {progress?.completed ? "Open" : started ? "Continue" : "Start"}
            </Link>
          </Button>
        </div>
      )}

      <div className="grid grid-cols-2 gap-3 lg:grid-cols-4">
        <Statistics
          label="Modules"
          value={String(tree.modules.length)}
          icon={BookOpen}
          description={exerciseCount > 0 ? `${exerciseCount} with an exercise` : undefined}
        />
        <Statistics label="Lessons" value={String(ordered.length)} icon={Play} />
        <Statistics label="Exercises" value={String(exerciseCount)} icon={FileQuestion} />
        <Statistics
          label="Progress"
          value={isEnrolled ? `${progress?.percentComplete ?? 0}%` : "—"}
          description={isEnrolled ? undefined : "Enrol to track this"}
        />
      </div>

      {ordered.length > 0 && (
        <div className="border-hairline bg-card rounded-xs border p-4">
          <h3 className="text-ink text-sm font-medium">What&apos;s inside</h3>
          <ul className="mt-3 space-y-2">
            {KIND_ORDER.filter((kind) => kindCounts.has(kind)).map((kind) => {
              const count = kindCounts.get(kind) ?? 0;
              const { label, plural, icon: Icon } = KIND_META[kind];
              return (
                <li className="flex items-center gap-2.5 text-sm" key={kind}>
                  <Icon className="text-muted-foreground size-4 shrink-0" />
                  <span className="text-muted-foreground">
                    <span className="text-ink mono-data">{count}</span>{" "}
                    {count === 1 ? label : plural}
                  </span>
                </li>
              );
            })}
            {exerciseCount > 0 && (
              <li className="flex items-center gap-2.5 text-sm">
                <FileQuestion className="text-muted-foreground size-4 shrink-0" />
                <span className="text-muted-foreground">
                  <span className="text-ink mono-data">{exerciseCount}</span> end-of-module{" "}
                  {exerciseCount === 1 ? "exercise" : "exercises"}
                </span>
              </li>
            )}
          </ul>
        </div>
      )}

      {ordered.length === 0 && (
        <p className="text-muted-foreground border-hairline bg-card rounded-xs border px-4 py-8 text-center text-sm">
          This course has no published lessons yet.
        </p>
      )}
    </div>
  );
};
