"use client";

import { useState } from "react";
import { ArrowLeft, Check, Clapperboard, FileText, HelpCircle, Volume2, X } from "lucide-react";

import { Badge, Button, PageLayout, Skeleton, Textarea } from "@datarango/ui";

import {
  useApproveCourse,
  useRejectCourse,
  useReviewCourseTree,
  type LessonKind,
  type ReviewQueueItem,
} from "@/hooks/review";

const LESSON_ICON: Record<LessonKind, React.ComponentType<{ className?: string }>> = {
  video: Clapperboard,
  audio: Volume2,
  text: FileText,
  quiz: HelpCircle,
};

/**
 * One course, in full, with the two decisions.
 *
 * The whole tree is rendered rather than a summary because the decision is
 * about the content: a reviewer who can only see a title and a module count is
 * approving on trust, which makes the queue theatre. This read is the reviewer's
 * own, admitted by the review policy to submitted work only.
 */
export const ReviewCourseDetail = ({
  item,
  onDone,
}: {
  item: ReviewQueueItem;
  onDone: () => void;
}) => {
  const { data: tree, isLoading } = useReviewCourseTree(item.courseId);
  const approve = useApproveCourse();
  const reject = useRejectCourse();

  const [rejecting, setRejecting] = useState(false);
  const [reason, setReason] = useState("");

  const busy = approve.isPending || reject.isPending;
  const trimmedReason = reason.trim();

  const submitRejection = () =>
    reject.mutate({ courseId: item.courseId, reason: trimmedReason }, { onSuccess: onDone });

  return (
    <PageLayout
      title={item.title}
      subtitle={item.summary || "No summary."}
      actions={[
        <Button
          key="approve"
          disabled={busy}
          onClick={() => approve.mutate({ courseId: item.courseId }, { onSuccess: onDone })}
        >
          <Check className="size-4" />
          {approve.isPending ? "Publishing…" : "Approve & publish"}
        </Button>,
        <Button
          key="reject"
          variant="outline"
          disabled={busy}
          onClick={() => setRejecting((open) => !open)}
        >
          <X className="size-4" />
          Send back
        </Button>,
      ]}
    >
      <button
        type="button"
        onClick={onDone}
        className="text-muted-foreground hover:text-ink inline-flex items-center gap-1 text-sm transition-colors"
      >
        <ArrowLeft className="size-3.5" />
        Back to the queue
      </button>

      <p className="text-muted-foreground text-xs">
        Approving publishes this immediately — there is no separate publish step, and the version
        will record you as the person who let it out.
      </p>

      {rejecting && (
        <div className="border-hairline bg-card space-y-2 rounded-xs border p-4">
          <label htmlFor="reject-reason" className="text-ink block text-sm font-medium">
            Why is this going back?
          </label>
          <p className="text-muted-foreground text-sm">
            The creator sees these words verbatim, and this is the only thing that tells them what
            to change. Required — the server refuses a rejection without one.
          </p>
          <Textarea
            id="reject-reason"
            rows={4}
            value={reason}
            onChange={(e) => setReason(e.target.value)}
            placeholder="e.g. Module 2's exercise doesn't cover the material in lessons 3–5."
          />
          <div className="flex justify-end gap-2">
            <Button variant="ghost" size="sm" onClick={() => setRejecting(false)}>
              Cancel
            </Button>
            <Button
              size="sm"
              variant="destructive"
              disabled={!trimmedReason || busy}
              onClick={submitRejection}
            >
              {reject.isPending ? "Sending…" : "Send back to creator"}
            </Button>
          </div>
        </div>
      )}

      {isLoading ? (
        <Skeleton skeleton="page" />
      ) : !tree ? (
        <div className="border-hairline bg-card rounded-xs border px-6 py-10 text-center">
          <p className="text-ink text-sm font-medium">This course is no longer in the queue</p>
          <p className="text-muted-foreground mt-1 text-sm">
            The creator may have withdrawn it, or another reviewer has already decided.
          </p>
        </div>
      ) : (
        <div className="space-y-3">
          {tree.modules.map((module, index) => (
            <div key={module.id} className="border-hairline bg-card rounded-xs border">
              <div className="border-hairline flex items-center gap-3 border-b px-4 py-2.5">
                <span className="text-muted-foreground w-6 text-xs tabular-nums">
                  {String(index + 1).padStart(2, "0")}
                </span>
                <div className="min-w-0 flex-1">
                  <p className="text-ink truncate text-sm font-medium">{module.title}</p>
                  {module.summary && (
                    <p className="text-muted-foreground truncate text-xs">{module.summary}</p>
                  )}
                </div>
                {/* Publish is refused without an exercise on every module, and
                    the check runs again at approval — so this should always be
                    set. Shown anyway: if it is ever missing, the reviewer should
                    see why their approval is about to fail. */}
                {module.exerciseId ? (
                  <Badge variant="success">Exercise set</Badge>
                ) : (
                  <Badge variant="destructive">No exercise</Badge>
                )}
              </div>

              <div className="px-4 py-2">
                {module.lessons.length === 0 ? (
                  <p className="text-muted-foreground py-1 text-xs">No lessons.</p>
                ) : (
                  module.lessons.map((lesson) => {
                    const Icon = LESSON_ICON[lesson.kind];
                    const missingMedia =
                      (lesson.kind === "video" || lesson.kind === "audio") && !lesson.muxPlaybackId;
                    return (
                      <div key={lesson.id} className="flex items-center gap-3 py-1.5 text-sm">
                        <Icon className="text-muted-foreground size-3.5 shrink-0" />
                        <span className="text-ink min-w-0 flex-1 truncate">{lesson.title}</span>
                        {/* Worth surfacing: a learner would reach this lesson
                            and find nothing to play. It does not block
                            publishing — the transcode may still be running — but
                            it is exactly the kind of thing a reviewer is for. */}
                        {missingMedia && <Badge variant="warning">No {lesson.kind} attached</Badge>}
                      </div>
                    );
                  })
                )}
              </div>
            </div>
          ))}
        </div>
      )}
    </PageLayout>
  );
};
