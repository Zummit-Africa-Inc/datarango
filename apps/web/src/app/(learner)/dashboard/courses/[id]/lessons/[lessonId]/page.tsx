"use client";

import { ArrowLeft, ChevronDown, Clapperboard, FileText, HelpCircle, Lock, Volume2 } from "lucide-react";
import { useParams, useRouter } from "next/navigation";
import MuxPlayer from "@mux/mux-player-react";
import { useMemo, useState } from "react";
import { motion } from "framer-motion";
import Link from "next/link";

import { Badge, Button, cn, PageLayout, Skeleton } from "@datarango/ui";
import { QuizRunner } from "@/components/learning/quiz-runner";
import {
  // useCompleteLesson,
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
  // const completeLesson = useCompleteLesson(courseId);

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
  // const next = index >= 0 ? ordered[index + 1] : undefined;

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
        className="text-muted-foreground hover:text-ink inline-flex items-center gap-1 text-sm transition-colors"
      >
        <ArrowLeft className="size-3.5" />
        Course overview
      </Link>
      <div className="grid grid-cols-1 gap-4 lg:grid-cols-5">
        <LessonBody
          lesson={current.lesson}
          courseId={courseId}
          courseVersionId={enrollment.courseVersionId}
        />
        {/* Lesson sidebar */}
        <div className="border-hairline bg-card space-y-1 border p-3">
          <h4 className="text-sm font-medium px-1 pb-2">Modules</h4>
          {tree.modules.map((mod, modIndex) => {
            const modProgress = progress?.modules.find((m) => m.moduleId === mod.id);
            const prevModProgress = modIndex > 0 ? progress?.modules.find((m) => m.moduleId === tree.modules[modIndex - 1]!.id) : null;
            const isLocked = modIndex > 0 && !!progress && !prevModProgress?.completed;
            const isExpanded = expandedModuleId === mod.id;
            return (
              <div key={mod.id}>
                <button
                  className="flex w-full items-center justify-between rounded-xs px-2 py-1.5 text-left hover:bg-muted/50 transition-colors"
                  onClick={() => !isLocked && handleExpandModule(mod.id)}
                  disabled={isLocked}
                >
                  <span className="text-xs font-medium truncate flex-1 pr-2">{mod.title}</span>
                  <span className="flex items-center gap-1.5 shrink-0">
                    {modProgress && (
                      <span className="text-muted-foreground text-[10px]">
                        {modProgress.lessonsCompleted}/{modProgress.lessonsTotal}
                      </span>
                    )}
                    {isLocked ? (
                      <Lock className="size-3.5 text-muted-foreground" />
                    ) : (
                      <ChevronDown className={cn("size-3.5 transition-transform", isExpanded && "rotate-180")} />
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
                      const LessonIcon =
                        lesson.kind === "video" ? Clapperboard
                        : lesson.kind === "audio" ? Volume2
                        : lesson.kind === "quiz" ? HelpCircle
                        : FileText;
                      return (
                        <button
                          key={lesson.id}
                          className={cn(
                            "flex w-full items-center gap-2 rounded-xs px-2 py-1.5 text-left text-xs transition-colors hover:bg-muted/50",
                            isActive && "bg-muted font-medium",
                          )}
                          onClick={() =>
                            router.push(`/dashboard/courses/${courseId}/lessons/${lesson.id}`)
                          }
                        >
                          <LessonIcon className={cn("size-3.5 shrink-0", isActive ? "text-ink" : "text-muted-foreground")} />
                          <span className="truncate">{lesson.title}</span>
                        </button>
                      );
                    })}
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
        <div className="border-hairline bg-card col-span-1 rounded-xs border px-6 py-12 text-center lg:col-span-4">
          <Icon className="text-muted-foreground mx-auto size-8" strokeWidth={1.5} />
          <p className="text-ink font-heading mt-3 text-lg">
            {lesson.kind === "video" ? "Video" : "Audio"} isn&apos;t available yet
          </p>
          <p className="text-muted-foreground mt-1 text-sm">
            The creator hasn&apos;t finished adding it. The rest of the course is unaffected.
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
          <p className="text-muted-foreground max-w-prose text-sm leading-relaxed whitespace-pre-wrap">
            {lesson.body}
          </p>
        )}
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
