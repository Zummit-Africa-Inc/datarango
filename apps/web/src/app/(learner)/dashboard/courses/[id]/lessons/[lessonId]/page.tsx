"use client";

import { useMemo } from "react";
import Link from "next/link";
import { useParams, useRouter } from "next/navigation";
import { ArrowLeft, ArrowRight, CheckCircle2, Clapperboard, Volume2 } from "lucide-react";

import { Badge, Button, PageLayout, Skeleton } from "@datarango/ui";

import { QuizRunner } from "@/components/learning/quiz-runner";
import {
  useCompleteLesson,
  useCourseProgress,
  useCourseTree,
  useMyEnrollments,
  type Lesson,
} from "@/hooks/learning";

export default function LessonPlayerPage() {
  const params = useParams<{ id: string; lessonId: string }>();
  const router = useRouter();
  const courseId = params.id;
  const lessonId = params.lessonId;

  const { data: tree, isLoading } = useCourseTree(courseId);
  const { data: enrollments } = useMyEnrollments();

  const enrollment = useMemo(
    () => (enrollments?.enrollments ?? []).find((e) => e.courseId === courseId),
    [enrollments, courseId],
  );

  const { data: progress } = useCourseProgress(courseId, !!enrollment);
  const completeLesson = useCompleteLesson(courseId);

  // A flat ordered list is what "next lesson" needs; the tree is grouped by
  // module, and lessons run continuously across module boundaries.
  const ordered = useMemo(
    () =>
      (tree?.modules ?? []).flatMap((module) =>
        module.lessons.map((lesson) => ({
          lesson,
          moduleId: module.id,
          moduleTitle: module.title,
        })),
      ),
    [tree],
  );

  const index = ordered.findIndex((entry) => entry.lesson.id === lessonId);
  const current = index >= 0 ? ordered[index] : undefined;
  const next = index >= 0 ? ordered[index + 1] : undefined;
  const previous = index > 0 ? ordered[index - 1] : undefined;

  if (isLoading) {
    return (
      <PageLayout title="Lesson" subtitle="Loading…">
        <Skeleton skeleton="page" />
      </PageLayout>
    );
  }

  if (!tree || !current) {
    return (
      <PageLayout title="Lesson not found" subtitle="It may have moved to a new course version.">
        <Button asChild variant="outline">
          <Link href={`/dashboard/courses/${courseId}`}>Back to the course</Link>
        </Button>
      </PageLayout>
    );
  }

  if (!enrollment) {
    return (
      <PageLayout title={current.lesson.title} subtitle="Enrol to start this course.">
        <Button asChild>
          <Link href={`/dashboard/courses/${courseId}`}>Go to the course</Link>
        </Button>
      </PageLayout>
    );
  }

  const goNext = () => {
    if (next) {
      router.push(`/dashboard/courses/${courseId}/lessons/${next.lesson.id}`);
    } else {
      router.push(`/dashboard/courses/${courseId}`);
    }
  };

  const markDoneAndContinue = () =>
    completeLesson.mutate({ lessonId: current.lesson.id }, { onSuccess: goNext });

  return (
    <PageLayout
      title={current.lesson.title}
      subtitle={`${current.moduleTitle} · lesson ${index + 1} of ${ordered.length}`}
      actions={[
        progress ? (
          <Badge key="progress" variant="outline">
            {progress.percentComplete}% complete
          </Badge>
        ) : null,
      ].filter(Boolean)}
    >
      <Link
        href={`/dashboard/courses/${courseId}`}
        className="text-muted-foreground hover:text-ink inline-flex items-center gap-1 text-sm transition-colors"
      >
        <ArrowLeft className="size-3.5" />
        Course overview
      </Link>

      <LessonBody
        lesson={current.lesson}
        courseId={courseId}
        courseVersionId={enrollment.courseVersionId}
      />

      <div className="border-hairline flex flex-wrap items-center justify-between gap-3 border-t pt-4">
        <Button asChild={!!previous} disabled={!previous} size="sm" variant="outline">
          {previous ? (
            <Link href={`/dashboard/courses/${courseId}/lessons/${previous.lesson.id}`}>
              <ArrowLeft className="size-3.5" />
              Previous
            </Link>
          ) : (
            <span>
              <ArrowLeft className="size-3.5" />
              Previous
            </span>
          )}
        </Button>

        <div className="flex items-center gap-2">
          {/* Quiz lessons complete themselves by being passed, so offering a
              "mark done" would let somebody skip the assessment entirely. */}
          {current.lesson.kind !== "quiz" && (
            <Button disabled={completeLesson.isPending} onClick={markDoneAndContinue}>
              <CheckCircle2 className="size-4" />
              {completeLesson.isPending ? "Saving…" : next ? "Done — next lesson" : "Mark done"}
            </Button>
          )}
          {next && (
            <Button asChild size="sm" variant="outline">
              <Link href={`/dashboard/courses/${courseId}/lessons/${next.lesson.id}`}>
                Skip
                <ArrowRight className="size-3.5" />
              </Link>
            </Button>
          )}
        </div>
      </div>
    </PageLayout>
  );
}

/* -------------------------------- lesson body ------------------------------- */

const LessonBody = ({
  lesson,
  courseId,
  courseVersionId,
}: {
  lesson: Lesson;
  courseId: string;
  courseVersionId: string;
}) => {
  if (lesson.kind === "quiz") {
    return (
      <QuizRunner
        // The lesson body holds the quiz id for a quiz lesson.
        quizId={lesson.body.trim()}
        context="lesson"
        courseId={courseId}
        courseVersionId={courseVersionId}
        lessonId={lesson.id}
      />
    );
  }

  if (lesson.kind === "video" || lesson.kind === "audio") {
    const Icon = lesson.kind === "video" ? Clapperboard : Volume2;

    // Playback ids are populated by platform.media once a Mux asset finishes
    // transcoding. Until that module exists every one of these is null, so the
    // honest thing is to say so rather than render a broken player.
    if (!lesson.muxPlaybackId) {
      return (
        <div className="border-hairline bg-card rounded-xs border px-6 py-12 text-center">
          <Icon className="text-muted-foreground mx-auto size-8" strokeWidth={1.5} />
          <p className="text-ink font-heading mt-3 text-lg">
            {lesson.kind === "video" ? "Video" : "Audio"} not uploaded yet
          </p>
          <p className="text-muted-foreground mt-1 text-sm">
            The creator hasn&apos;t attached media to this lesson.
          </p>
          {lesson.body && (
            <p className="text-muted-foreground mx-auto mt-4 max-w-prose text-left text-sm leading-relaxed whitespace-pre-wrap">
              {lesson.body}
            </p>
          )}
        </div>
      );
    }

    return (
      <div className="border-hairline bg-ink rounded-xs border p-4 text-center text-white">
        <p className="text-sm">Playback {lesson.muxPlaybackId}</p>
      </div>
    );
  }

  return (
    <article className="border-hairline bg-card rounded-xs border p-6">
      {lesson.body ? (
        // Lesson bodies are markdown-ish today. Rendered as pre-wrapped text
        // rather than injected as HTML — a creator-authored body is untrusted
        // input, and a markdown pipeline is its own decision.
        <div className="max-w-prose text-sm leading-relaxed whitespace-pre-wrap">{lesson.body}</div>
      ) : (
        <p className="text-muted-foreground text-sm">This lesson has no content yet.</p>
      )}
    </article>
  );
};
