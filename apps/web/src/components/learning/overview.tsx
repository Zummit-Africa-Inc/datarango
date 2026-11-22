"use client";

import {
  BookOpen,
  Check,
  Clapperboard,
  FileQuestion,
  FileText,
  Users,
  Volume2,
} from "lucide-react";
import { useMemo } from "react";

import { Markdown } from "@datarango/ui";
import type { CourseTree, LessonKind, ProgressSnapshot } from "@/hooks/learning";

const KIND_META: Record<LessonKind, { label: string; plural: string; icon: typeof FileText }> = {
  video: { label: "video", plural: "videos", icon: Clapperboard },
  text: { label: "reading", plural: "readings", icon: FileText },
  audio: { label: "audio lesson", plural: "audio lessons", icon: Volume2 },
  quiz: { label: "quiz", plural: "quizzes", icon: FileQuestion },
};

// Order the breakdown reads in, rather than whatever order the kinds happen to
// appear in the course.
const KIND_ORDER: LessonKind[] = ["video", "text", "audio", "quiz"];

/**
 * Where Continue goes: the first lesson not yet completed, in the same order
 * the lesson player's next/previous uses. With everything done (a course can be
 * all-lessons-done and still incomplete, since module exercises are a separate
 * gate) it offers the first lesson for a re-read.
 */
export const useResumeLesson = (
  tree: CourseTree | undefined,
  progress: ProgressSnapshot | undefined,
) =>
  useMemo(() => {
    const ordered = tree?.modules.flatMap((mod) => mod.lessons) ?? [];
    if (!progress) return ordered[0];
    const done = new Set(progress.modules.flatMap((m) => m.completedLessonIds));
    return ordered.find((lesson) => !done.has(lesson.id)) ?? ordered[0];
  }, [tree, progress]);

interface Props {
  tree: NoInfer<CourseTree>;
}

export const Overview = ({ tree }: Props) => {
  // Same flattening the lesson player uses, so "continue" lands on the lesson
  // its own next/previous navigation would agree with.
  const ordered = useMemo(() => tree.modules.flatMap((mod) => mod.lessons), [tree]);

  const kindCounts = useMemo(() => {
    const counts = new Map<LessonKind, number>();
    for (const lesson of ordered) counts.set(lesson.kind, (counts.get(lesson.kind) ?? 0) + 1);
    return counts;
  }, [ordered]);

  const exerciseCount = tree.modules.filter((mod) => mod.exerciseId).length;

  const course = tree.course;

  return (
    <div className="space-y-4">
      {/* The description the creator wrote, ahead of the structural counts:
          somebody deciding whether to take a course wants to know what it
          teaches before they know how many videos it has. Each section renders
          only when it has content — a course with no overview shows the same
          page it always did rather than a row of empty headings. */}
      {course.learningOutcomes.length > 0 && (
        <div className="border-border bg-card rounded-lg border p-4">
          <h3 className="text-foreground text-sm font-medium">What you&apos;ll learn</h3>
          <ul className="mt-3 grid gap-2 sm:grid-cols-2">
            {course.learningOutcomes.map((outcome) => (
              <li className="flex items-start gap-2.5 text-sm" key={outcome}>
                <Check className="text-primary mt-0.5 size-4 shrink-0" />
                <span className="text-foreground-muted">{outcome}</span>
              </li>
            ))}
          </ul>
        </div>
      )}

      {course.overview && (
        <div className="border-border bg-card rounded-lg border p-4">
          <h3 className="text-foreground text-sm font-medium">About this course</h3>
          <div className="mt-3">
            <Markdown>{course.overview}</Markdown>
          </div>
        </div>
      )}

      {(course.prerequisites.length > 0 || course.targetAudience) && (
        <div className="grid gap-3 sm:grid-cols-2">
          {course.prerequisites.length > 0 && (
            <div className="border-border bg-card rounded-lg border p-4">
              <h3 className="text-foreground text-sm font-medium">Before you start</h3>
              <ul className="mt-3 space-y-2">
                {course.prerequisites.map((prerequisite) => (
                  <li className="flex items-start gap-2.5 text-sm" key={prerequisite}>
                    <BookOpen className="text-foreground-muted mt-0.5 size-4 shrink-0" />
                    <span className="text-foreground-muted">{prerequisite}</span>
                  </li>
                ))}
              </ul>
            </div>
          )}
          {course.targetAudience && (
            <div className="border-border bg-card rounded-lg border p-4">
              <h3 className="text-foreground text-sm font-medium">Who it&apos;s for</h3>
              <p className="text-foreground-muted mt-3 flex items-start gap-2.5 text-sm">
                <Users className="text-foreground-muted mt-0.5 size-4 shrink-0" />
                <span>{course.targetAudience}</span>
              </p>
            </div>
          )}
        </div>
      )}

      {ordered.length > 0 && (
        <div className="border-border bg-card rounded-lg border p-4">
          <h3 className="text-foreground text-sm font-medium">What&apos;s inside</h3>
          <ul className="mt-3 space-y-2">
            {KIND_ORDER.filter((kind) => kindCounts.has(kind)).map((kind) => {
              const count = kindCounts.get(kind) ?? 0;
              const { label, plural, icon: Icon } = KIND_META[kind];
              return (
                <li className="flex items-center gap-2.5 text-sm" key={kind}>
                  <Icon className="text-foreground-muted size-4 shrink-0" />
                  <span className="text-foreground-muted">
                    <span className="text-foreground mono-data">{count}</span>{" "}
                    {count === 1 ? label : plural}
                  </span>
                </li>
              );
            })}
            {exerciseCount > 0 && (
              <li className="flex items-center gap-2.5 text-sm">
                <FileQuestion className="text-foreground-muted size-4 shrink-0" />
                <span className="text-foreground-muted">
                  <span className="text-foreground mono-data">{exerciseCount}</span> end-of-module{" "}
                  {exerciseCount === 1 ? "exercise" : "exercises"}
                </span>
              </li>
            )}
          </ul>
        </div>
      )}

      {ordered.length === 0 && (
        <p className="text-foreground-muted border-border bg-card rounded-lg border px-4 py-8 text-center text-sm">
          This course has no published lessons yet.
        </p>
      )}
    </div>
  );
};
