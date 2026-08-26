"use client";

import { useParams, useRouter } from "next/navigation";
import MuxPlayer from "@mux/mux-player-react";
import { useMemo, useState } from "react";
import { motion } from "framer-motion";
import Link from "next/link";
import {
  ArrowLeft,
  ArrowRight,
  Check,
  CheckCircle2,
  ChevronDown,
  Clapperboard,
  FileQuestion,
  FileText,
  HelpCircle,
  Lock,
  Volume2,
} from "lucide-react";

import { Badge, Button, cn, Markdown, PageLayout, Skeleton } from "@datarango/ui";
import { QuizRunner } from "@/components/learning/quiz-runner";
import {
  useCompleteLesson,
  useCourseProgress,
  useCourseTree,
  useMyEnrollments,
  type Lesson,
} from "@/hooks/learning";

export default function LessonPlayerPage() {
  const [expandedModuleId, setExpandedModuleId] = useState<string | null>(null);
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

  // Every lesson this learner has finished, flattened across modules. The
  // per-module `completedLessonIds` is what makes this possible at all — the
  // snapshot used to carry counts only, which is why nothing here could show a
  // tick and why the mark-complete call sat commented out.
  const completedLessonIds = useMemo(
    () => new Set((progress?.modules ?? []).flatMap((m) => m.completedLessonIds)),
    [progress],
  );

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

  const handleExpandModule = (moduleId: string) => {
    setExpandedModuleId((prev) => (prev === moduleId ? null : moduleId));
  };

  return (
    <PageLayout
      // From lg up the page stops scrolling and becomes two panes that scroll
      // themselves. A flex column is what makes that work without arithmetic:
      // the title block and the back-link take their natural heights and the
      // grid below claims whatever is left, so neither pane can outgrow the
      // viewport no matter how the heading wraps.
      className="lg:flex lg:flex-col"
      title={current.lesson.title}
      subtitle={`${current.moduleTitle} · Lesson ${index + 1} of ${ordered.length}`}
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
        // self-start keeps the hit area the width of the text: as a flex item
        // under the lg layout it would otherwise stretch the full row.
        className="text-muted-foreground hover:text-ink inline-flex items-center gap-1 text-sm transition-colors lg:self-start"
      >
        <ArrowLeft className="size-3.5" />
        Course overview
      </Link>
      {/* `min-h-0` is what actually stops the overflow: a flex item's default
          `min-height: auto` refuses to shrink below its content, so without it
          a long module list pushes this row past the bottom of the screen
          instead of scrolling inside it. */}
      <div className="grid grid-cols-1 gap-4 lg:min-h-0 lg:flex-1 lg:grid-cols-5">
        {/* Grid placement lives here rather than on the bodies themselves, so
            every lesson kind lands in the same four columns — the quiz branch
            carried no span at all and was rendering a fifth of the width. Both
            panes stretch to the row height by default and scroll their own
            overflow, which is what keeps the video in place while the module
            list moves, without pinning anything. */}
        <div className="col-span-1 space-y-4 lg:col-span-4 lg:min-h-0 lg:overflow-y-auto lg:overscroll-contain">
          <LessonBody
            lesson={current.lesson}
            courseId={courseId}
            courseVersionId={enrollment.courseVersionId}
          />
          {/* A quiz lesson is completed by passing it, not by asserting you are
              done with it — the runner's own submission advances progress. */}
          {current.lesson.kind !== "quiz" && (
            <LessonFooter
              courseId={courseId}
              completed={completedLessonIds.has(current.lesson.id)}
              pending={completeLesson.isPending}
              onComplete={() => completeLesson.mutate({ lessonId: current.lesson.id })}
              next={next}
              moduleId={current.moduleId}
              moduleLessonsDone={(() => {
                const mp = progress?.modules.find((m) => m.moduleId === current.moduleId);
                return !!mp && mp.lessonsCompleted === mp.lessonsTotal;
              })()}
              exercisePassed={
                progress?.modules.find((m) => m.moduleId === current.moduleId)?.exercisePassed ??
                false
              }
              hasExercise={!!tree.modules.find((m) => m.id === current.moduleId)?.exerciseId}
            />
          )}
        </div>
        {/* Lesson sidebar: stretched to the full height of the row, so the card
            always runs floor to ceiling, and scrolling its own overflow rather
            than the page's. */}
        <div className="border-hairline bg-card space-y-1 border p-3 lg:min-h-0 lg:overflow-y-auto lg:overscroll-contain">
          <h4 className="px-1 pb-2 text-sm font-medium">Modules</h4>
          {tree.modules.map((mod, modIndex) => {
            const modProgress = progress?.modules.find((m) => m.moduleId === mod.id);
            const prevModProgress =
              modIndex > 0
                ? progress?.modules.find((m) => m.moduleId === tree.modules[modIndex - 1]!.id)
                : null;
            const isLocked = modIndex > 0 && !!progress && !prevModProgress?.completed;
            const isExpanded = expandedModuleId === mod.id;
            return (
              <div key={mod.id}>
                <button
                  className="hover:bg-muted/50 flex w-full items-center justify-between rounded-xs px-2 py-1.5 text-left transition-colors"
                  onClick={() => !isLocked && handleExpandModule(mod.id)}
                  disabled={isLocked}
                >
                  <span className="flex-1 truncate pr-2 text-xs font-medium">{mod.title}</span>
                  <span className="flex shrink-0 items-center gap-1.5">
                    {modProgress && (
                      <span className="text-muted-foreground text-[10px]">
                        {modProgress.lessonsCompleted}/{modProgress.lessonsTotal}
                      </span>
                    )}
                    {isLocked ? (
                      <Lock className="text-muted-foreground size-3.5" />
                    ) : (
                      <ChevronDown
                        className={cn("size-3.5 transition-transform", isExpanded && "rotate-180")}
                      />
                    )}
                  </span>
                </button>
                <motion.div
                  animate={{ height: isExpanded ? "auto" : 0 }}
                  initial={{ height: 0 }}
                  style={{ overflow: "hidden" }}
                >
                  <div className="pb-1">
                    {mod.lessons.map((lesson) => {
                      const isActive = lesson.id === lessonId;
                      const isDone = completedLessonIds.has(lesson.id);
                      const LessonIcon =
                        lesson.kind === "video"
                          ? Clapperboard
                          : lesson.kind === "audio"
                            ? Volume2
                            : lesson.kind === "quiz"
                              ? HelpCircle
                              : FileText;
                      return (
                        <button
                          key={lesson.id}
                          className={cn(
                            "hover:bg-muted/50 flex w-full items-center gap-2 rounded-xs px-2 py-1.5 text-left text-xs transition-colors",
                            isActive && "bg-muted font-medium",
                          )}
                          onClick={() =>
                            router.push(`/dashboard/courses/${courseId}/lessons/${lesson.id}`)
                          }
                        >
                          {/* The tick replaces the kind icon rather than sitting
                              beside it: in a narrow rail two glyphs per row read
                              as noise, and "done" is the more useful of the two
                              once you have opened the lesson. */}
                          {isDone ? (
                            <CheckCircle2 className="size-3.5 shrink-0 text-emerald-600" />
                          ) : (
                            <LessonIcon
                              className={cn(
                                "size-3.5 shrink-0",
                                isActive ? "text-ink" : "text-muted-foreground",
                              )}
                            />
                          )}
                          <span
                            className={cn(
                              "truncate",
                              isDone && !isActive && "text-muted-foreground",
                            )}
                          >
                            {lesson.title}
                          </span>
                        </button>
                      );
                    })}
                    {mod.exerciseId && (
                      <button
                        className="hover:bg-muted/50 flex w-full items-center gap-2 rounded-xs px-2 py-1.5 text-left text-xs transition-colors"
                        onClick={() =>
                          router.push(`/dashboard/courses/${courseId}/modules/${mod.id}/exercise`)
                        }
                      >
                        {modProgress?.exercisePassed ? (
                          <CheckCircle2 className="size-3.5 shrink-0 text-emerald-600" />
                        ) : (
                          <FileQuestion className="text-muted-foreground size-3.5 shrink-0" />
                        )}
                        <span className="truncate">Exercise</span>
                      </button>
                    )}
                  </div>
                </motion.div>
              </div>
            );
          })}
        </div>
      </div>
    </PageLayout>
  );
}

/* ------------------------------ lesson footer ------------------------------- */

/**
 * Marking a lesson done, and what to do next.
 *
 * The mutation behind this existed and was **imported commented-out** — so a
 * learner could read every lesson in a course and never advance a single
 * percent, and module completion, certificates and org progress reporting all
 * hung off a button nobody had built. Same "exists but nothing drives it" shape
 * as the undrained outbox and the unreachable SSO config.
 *
 * Completion is explicit and stays explicit. Reaching the end of a video is not
 * the same act as saying you are done with the lesson, and this feeds a
 * credential — so nothing here marks progress on the learner's behalf.
 */
const LessonFooter = ({
  courseId,
  completed,
  pending,
  onComplete,
  next,
  moduleId,
  moduleLessonsDone,
  exercisePassed,
  hasExercise,
}: {
  courseId: string;
  completed: boolean;
  pending: boolean;
  onComplete: () => void;
  next: { lesson: Lesson } | undefined;
  moduleId: string;
  moduleLessonsDone: boolean;
  exercisePassed: boolean;
  hasExercise: boolean;
}) => {
  // The exercise is offered the moment the module's lessons are done — that is
  // the point at which it becomes takeable, and it is the only remaining step
  // between the learner and a completed module. Offering it earlier would spend
  // one of their attempts on something that could not count.
  const offerExercise = hasExercise && moduleLessonsDone && !exercisePassed;

  return (
    <div className="border-hairline bg-card flex flex-wrap items-center justify-between gap-3 rounded-xs border p-4">
      <div className="min-w-0">
        {completed ? (
          <p className="text-ink flex items-center gap-2 text-sm font-medium">
            <CheckCircle2 className="size-4 shrink-0 text-emerald-600" />
            Lesson complete
          </p>
        ) : (
          <>
            <p className="text-ink text-sm font-medium">Finished this lesson?</p>
            <p className="text-muted-foreground mt-1 text-sm">
              Marking it done is what moves your progress — nothing is recorded for you.
            </p>
          </>
        )}
      </div>

      <div className="flex flex-wrap items-center gap-2">
        {!completed && (
          <Button onClick={onComplete} disabled={pending}>
            {pending ? (
              "Saving…"
            ) : (
              <>
                <Check className="size-3.5" />
                Mark complete
              </>
            )}
          </Button>
        )}
        {offerExercise && (
          <Button asChild variant={completed ? "default" : "outline"}>
            <Link href={`/dashboard/courses/${courseId}/modules/${moduleId}/exercise`}>
              <FileQuestion className="size-3.5" />
              Take the exercise
            </Link>
          </Button>
        )}
        {next && (
          <Button asChild variant={completed && !offerExercise ? "default" : "outline"}>
            <Link href={`/dashboard/courses/${courseId}/lessons/${next.lesson.id}`}>
              Next lesson
              <ArrowRight className="size-3.5" />
            </Link>
          </Button>
        )}
      </div>
    </div>
  );
};

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

    // A playback id is written onto the lesson by learning's consumer of
    // `dr.media.asset.ready`, which only fires once the transcode finishes. So
    // null means either "never uploaded" or "still processing", and a learner
    // has no way to tell the two apart — media assets are owner-scoped to the
    // creator. The copy therefore says what is true of both rather than
    // guessing at which, and does not render a player with nothing to play.
    if (!lesson.muxPlaybackId) {
      return (
        <div className="border-hairline bg-card rounded-xs border px-6 py-12 text-center">
          <Icon className="text-muted-foreground mx-auto size-8" strokeWidth={1.5} />
          <p className="text-ink font-heading mt-3 text-lg">
            {lesson.kind === "video" ? "Video" : "Audio"} isn&apos;t available yet
          </p>
          <p className="text-muted-foreground mt-1 text-sm">
            The creator hasn&apos;t finished adding it. The rest of the course is unaffected.
          </p>
          {lesson.body && (
            <Markdown className="text-muted-foreground mx-auto mt-4 max-w-prose text-left text-xs leading-relaxed">
              {lesson.body}
            </Markdown>
          )}
        </div>
      );
    }

    return (
      <div className="space-y-4">
        <MuxPlayer
          playbackId={lesson.muxPlaybackId}
          streamType="on-demand"
          // Renders the audio-only chrome — no black letterbox where a picture
          // would be — for a lesson the creator authored as audio.
          audio={lesson.kind === "audio"}
          // Mux Data keys its analytics off these. `video_id` is the lesson so
          // that watch data lines up with course structure rather than with an
          // asset id nothing else in the product refers to.
          metadata={{ video_id: lesson.id, video_title: lesson.title }}
          // Playback is never marked complete on our behalf: reaching the end of
          // a video is not the same act as saying you are done with the lesson,
          // and progress here feeds module completion, certificates and org
          // reporting. The explicit button below stays the only way.
          className="aspect-video w-full overflow-hidden rounded-xs"
        />
        {lesson.body && (
          <Markdown className="text-muted-foreground max-w-prose text-xs leading-relaxed">
            {lesson.body}
          </Markdown>
        )}
      </div>
    );
  }

  return (
    <article className="border-hairline bg-card rounded-xs border p-6">
      {lesson.body ? (
        // Creator bodies are untrusted input. The Markdown component renders
        // them through a pipeline with no raw-HTML pass — see the safety note
        // on the component for why that is structural rather than remembered.
        <Markdown>{lesson.body}</Markdown>
      ) : (
        <p className="text-muted-foreground text-sm">This lesson has no content yet.</p>
      )}
    </article>
  );
};
