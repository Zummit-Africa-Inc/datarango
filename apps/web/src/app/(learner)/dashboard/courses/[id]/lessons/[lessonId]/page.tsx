"use client";

import { useParams } from "next/navigation";
import MuxPlayer from "@mux/mux-player-react";
import { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import {
  ArrowLeft,
  ArrowRight,
  BookOpen,
  Check,
  CheckCircle2,
  ChevronDown,
  Clapperboard,
  FileQuestion,
  FileText,
  HelpCircle,
  Lock,
  Pause,
  Volume2,
} from "lucide-react";

import { Badge, Button, EmptyState, Markdown, Skeleton, SteppedProgress, cn } from "@datarango/ui";
import { QuizRunner } from "@/components/learning/quiz-runner";
import {
  useCompleteLesson,
  useCourseProgress,
  useCourseTree,
  useMyEnrollments,
  type CourseTree,
  type Lesson,
  type ProgressSnapshot,
} from "@/hooks/learning";

/** Course view (§7.4): the lesson in the main column, progress and curriculum in the rail. */
export default function LessonPlayerPage() {
  const params = useParams<{ id: string; lessonId: string }>();
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

  // Every lesson this learner has finished, flattened across modules.
  const completedLessonIds = useMemo(
    () => new Set((progress?.modules ?? []).flatMap((m) => m.completedLessonIds)),
    [progress],
  );

  // A flat ordered list is what "next lesson" needs; lessons run continuously
  // across module boundaries.
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

  if (isLoading) return <Skeleton skeleton="page" />;

  if (!tree || !current) {
    return (
      <EmptyState
        icon={BookOpen}
        title="Lesson not found"
        hint="It may have moved to a new course version."
        action={
          <Button asChild variant="outline">
            <Link href={`/dashboard/courses/${courseId}`}>Back to the course</Link>
          </Button>
        }
      />
    );
  }

  if (!enrollment) {
    return (
      <EmptyState
        icon={Lock}
        title={current.lesson.title}
        hint="Enrol to start this course."
        action={
          <Button asChild>
            <Link href={`/dashboard/courses/${courseId}`}>Go to the course</Link>
          </Button>
        }
      />
    );
  }

  const moduleProgress = progress?.modules.find((m) => m.moduleId === current.moduleId);

  return (
    <div className="grid gap-6 lg:grid-cols-[minmax(0,1fr)_22rem]">
      <div className="min-w-0 space-y-5">
        <div>
          <Link
            href={`/dashboard/courses/${courseId}`}
            className="text-foreground-muted hover:text-foreground inline-flex items-center gap-1 text-sm transition-colors"
          >
            <ArrowLeft className="size-3.5" />
            {tree.course.title}
          </Link>
          <p className="text-primary-soft-foreground mt-3 text-xs font-semibold tracking-[0.06em] uppercase">
            {current.moduleTitle} · Lesson {index + 1} of {ordered.length}
          </p>
          <h1 className="font-display text-foreground mt-1 text-2xl leading-tight font-semibold tracking-tight sm:text-3xl">
            {current.lesson.title}
          </h1>
        </div>

        <LessonBody
          lesson={current.lesson}
          courseId={courseId}
          courseVersionId={enrollment.courseVersionId}
        />
        {/* A quiz lesson is completed by passing it, not by asserting you are
            done with it: the runner's own submission advances progress. */}
        {current.lesson.kind !== "quiz" && (
          <LessonFooter
            courseId={courseId}
            completed={completedLessonIds.has(current.lesson.id)}
            pending={completeLesson.isPending}
            onComplete={() => completeLesson.mutate({ lessonId: current.lesson.id })}
            next={next}
            moduleId={current.moduleId}
            moduleLessonsDone={
              !!moduleProgress && moduleProgress.lessonsCompleted === moduleProgress.lessonsTotal
            }
            exercisePassed={moduleProgress?.exercisePassed ?? false}
            hasExercise={!!tree.modules.find((m) => m.id === current.moduleId)?.exerciseId}
          />
        )}
      </div>

      <aside className="space-y-4 lg:sticky lg:top-0 lg:max-h-[calc(100dvh-8rem)] lg:self-start lg:overflow-y-auto lg:overscroll-contain">
        <section className="border-border bg-card space-y-3 rounded-lg border p-4">
          <h2 className="font-display text-foreground text-sm font-semibold">Study progress</h2>
          <SteppedProgress
            value={progress?.completed ? 100 : (progress?.percentComplete ?? 0)}
            label={`${progress?.percentComplete ?? 0}% complete`}
          />
        </section>
        <Curriculum
          courseId={courseId}
          tree={tree}
          lessonId={lessonId}
          currentModuleId={current.moduleId}
          progress={progress}
          completedLessonIds={completedLessonIds}
        />
      </aside>
    </div>
  );
}

/* -------------------------------- curriculum -------------------------------- */

const KIND_ICON = {
  video: Clapperboard,
  audio: Volume2,
  quiz: HelpCircle,
  text: FileText,
} as const;

/**
 * Curriculum rail (§7.4). The current lesson's module starts open (the old
 * rail started with every module shut, hiding where you were). Rows show the
 * lesson type, or a tick once done; the current row is filled primary with a
 * pause glyph. A module stays locked until the one before it is complete, and
 * its exercise is marked Required because it gates the module.
 */
const Curriculum = ({
  courseId,
  tree,
  lessonId,
  currentModuleId,
  progress,
  completedLessonIds,
}: {
  courseId: string;
  tree: CourseTree;
  lessonId: string;
  currentModuleId: string;
  progress: ProgressSnapshot | undefined;
  completedLessonIds: Set<string>;
}) => {
  const [open, setOpen] = useState<Set<string>>(() => new Set([currentModuleId]));

  // Moving to a lesson in another module opens that module too.
  useEffect(() => {
    setOpen((prev) => (prev.has(currentModuleId) ? prev : new Set(prev).add(currentModuleId)));
  }, [currentModuleId]);

  const toggle = (moduleId: string) =>
    setOpen((prev) => {
      const next = new Set(prev);
      if (next.has(moduleId)) next.delete(moduleId);
      else next.add(moduleId);
      return next;
    });

  return (
    <nav aria-label="Curriculum" className="border-border bg-card rounded-lg border p-2">
      <h2 className="font-display text-foreground px-2 pt-2 pb-1 text-sm font-semibold">
        Curriculum
      </h2>
      <ol className="space-y-1">
        {tree.modules.map((mod, modIndex) => {
          const modProgress = progress?.modules.find((m) => m.moduleId === mod.id);
          const prevModule = modIndex > 0 ? tree.modules[modIndex - 1] : undefined;
          const prevProgress = prevModule
            ? progress?.modules.find((m) => m.moduleId === prevModule.id)
            : undefined;
          const isLocked = !!prevModule && !!progress && !prevProgress?.completed;
          const isOpen = open.has(mod.id) && !isLocked;
          const panelId = `module-${mod.id}`;

          return (
            <li key={mod.id}>
              <button
                type="button"
                aria-expanded={isOpen}
                aria-controls={panelId}
                disabled={isLocked}
                onClick={() => toggle(mod.id)}
                className="hover:bg-muted focus-visible:ring-ring flex w-full items-center gap-2 rounded-md px-2 py-2 text-left outline-none focus-visible:ring-2 disabled:cursor-not-allowed disabled:opacity-60"
              >
                <span className="min-w-0 flex-1">
                  <span className="text-foreground-subtle block text-[0.6875rem] font-medium tracking-[0.06em] uppercase">
                    Module {modIndex + 1}
                  </span>
                  <span className="text-foreground block truncate text-sm font-medium">
                    {mod.title}
                  </span>
                </span>
                {modProgress && (
                  <span className="text-foreground-muted font-mono text-xs tabular-nums">
                    {modProgress.lessonsCompleted}/{modProgress.lessonsTotal}
                  </span>
                )}
                {isLocked ? (
                  <Lock aria-label="Locked" className="text-foreground-subtle size-4 shrink-0" />
                ) : (
                  <ChevronDown
                    aria-hidden="true"
                    className={cn(
                      "text-foreground-subtle size-4 shrink-0 transition-transform",
                      isOpen && "rotate-180",
                    )}
                  />
                )}
              </button>
              {isOpen && (
                <ul id={panelId} className="space-y-0.5 pt-0.5 pb-1">
                  {mod.lessons.map((lesson) => {
                    const isActive = lesson.id === lessonId;
                    const isDone = completedLessonIds.has(lesson.id);
                    const Icon = isActive ? Pause : isDone ? CheckCircle2 : KIND_ICON[lesson.kind];
                    return (
                      <li key={lesson.id}>
                        <Link
                          href={`/dashboard/courses/${courseId}/lessons/${lesson.id}`}
                          aria-current={isActive ? "page" : undefined}
                          className={cn(
                            "focus-visible:ring-ring flex items-center gap-2.5 rounded-md px-2 py-2 text-sm outline-none focus-visible:ring-2",
                            isActive
                              ? "bg-primary text-primary-foreground font-medium"
                              : "hover:bg-muted text-foreground",
                          )}
                        >
                          <Icon
                            aria-hidden="true"
                            className={cn(
                              "size-4 shrink-0",
                              !isActive && (isDone ? "text-success" : "text-foreground-subtle"),
                            )}
                          />
                          <span
                            className={cn(
                              "truncate",
                              isDone && !isActive && "text-foreground-muted",
                            )}
                          >
                            {lesson.title}
                          </span>
                          {isDone && !isActive && <span className="sr-only">(completed)</span>}
                        </Link>
                      </li>
                    );
                  })}
                  {mod.exerciseId && (
                    <li>
                      <Link
                        href={`/dashboard/courses/${courseId}/modules/${mod.id}/exercise`}
                        className="hover:bg-muted focus-visible:ring-ring flex items-center gap-2.5 rounded-md px-2 py-2 text-sm outline-none focus-visible:ring-2"
                      >
                        {modProgress?.exercisePassed ? (
                          <CheckCircle2
                            aria-hidden="true"
                            className="text-success size-4 shrink-0"
                          />
                        ) : (
                          <FileQuestion
                            aria-hidden="true"
                            className="text-foreground-subtle size-4 shrink-0"
                          />
                        )}
                        <span className="text-foreground min-w-0 flex-1 truncate">
                          Module exercise
                        </span>
                        {modProgress?.exercisePassed ? (
                          <span className="sr-only">(passed)</span>
                        ) : (
                          <Badge tone="warning" appearance="soft" size="sm">
                            Required
                          </Badge>
                        )}
                      </Link>
                    </li>
                  )}
                </ul>
              )}
            </li>
          );
        })}
      </ol>
    </nav>
  );
};

/* ------------------------------ lesson footer ------------------------------- */

/**
 * Marking a lesson done, and what to do next.
 *
 * Completion is explicit and stays explicit. Reaching the end of a video is not
 * the same act as saying you are done with the lesson, and this feeds a
 * credential, so nothing here marks progress on the learner's behalf.
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
  // The exercise is offered once the module's lessons are done: that is when it
  // becomes takeable. Offering it earlier would spend an attempt that couldn't count.
  const offerExercise = hasExercise && moduleLessonsDone && !exercisePassed;

  return (
    <div className="border-border bg-card flex flex-wrap items-center justify-between gap-3 rounded-lg border p-4">
      <div className="min-w-0">
        {completed ? (
          <p className="text-foreground flex items-center gap-2 text-sm font-medium">
            <CheckCircle2 className="text-success size-4 shrink-0" />
            Lesson complete
          </p>
        ) : (
          <>
            <p className="text-foreground text-sm font-medium">Finished this lesson?</p>
            <p className="text-foreground-muted mt-1 text-sm">
              Marking it done is what moves your progress. Nothing is recorded for you.
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

    // A playback id appears once the transcode finishes, so null means either
    // "never uploaded" or "still processing", and a learner can't tell which.
    // The copy says what's true of both, and no empty player is rendered.
    if (!lesson.muxPlaybackId) {
      return (
        <EmptyState
          icon={Icon}
          title={`${lesson.kind === "video" ? "Video" : "Audio"} isn't available yet`}
          hint="The creator hasn't finished adding it. The rest of the course is unaffected."
          action={
            lesson.body ? (
              <Markdown className="text-foreground-muted mx-auto max-w-prose text-left text-sm leading-relaxed">
                {lesson.body}
              </Markdown>
            ) : undefined
          }
        />
      );
    }

    return (
      <div className="space-y-4">
        <div className="border-border overflow-hidden rounded-lg border bg-black">
          <MuxPlayer
            playbackId={lesson.muxPlaybackId}
            streamType="on-demand"
            // Audio-only chrome, with no black letterbox, for an audio lesson.
            audio={lesson.kind === "audio"}
            // Mux Data keys analytics off these; the lesson id lines watch data
            // up with course structure.
            metadata={{ video_id: lesson.id, video_title: lesson.title }}
            // Themed to the primary token. Playback never marks a lesson done;
            // the explicit button below is the only way.
            accentColor="var(--primary)"
            className="aspect-video w-full"
          />
        </div>
        {lesson.body && (
          <Markdown className="text-foreground-muted max-w-prose text-sm leading-relaxed">
            {lesson.body}
          </Markdown>
        )}
      </div>
    );
  }

  return (
    <article className="border-border bg-card rounded-lg border p-6 sm:p-8">
      {lesson.body ? (
        // Creator bodies are untrusted input; Markdown has no raw-HTML pass.
        <Markdown>{lesson.body}</Markdown>
      ) : (
        <p className="text-foreground-muted text-sm">This lesson has no content yet.</p>
      )}
    </article>
  );
};
