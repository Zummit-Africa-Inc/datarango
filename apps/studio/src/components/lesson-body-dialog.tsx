"use client";

import { useState } from "react";
import { BookOpen, PenLine } from "lucide-react";

import {
  Button,
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
  Markdown,
  Textarea,
} from "@datarango/ui";

import { useUpdateLesson, type Lesson } from "@/hooks/catalog";

/**
 * Writes a lesson's body as markdown.
 *
 * This is the only surface where a body can be authored at all — lessons are
 * created empty and `update_lesson` carried a `body` field nothing drove. Quiz
 * lessons are excluded by the caller: their body holds a quiz id, not prose.
 *
 * Rendering on the learner side goes through the shared `Markdown` component,
 * which parses no raw HTML and URL-transforms every link — see its safety note
 * for why creator-authored content stays inert even when hostile.
 */
export const LessonBodyDialog = ({
  courseId,
  lesson,
  frozen,
}: {
  courseId: string;
  lesson: Lesson;
  /** Published courses are immutable — the backend refuses edits either way. */
  frozen: boolean;
}) => {
  const updateLesson = useUpdateLesson(courseId);
  const [open, setOpen] = useState(false);
  const [draft, setDraft] = useState(lesson.body);
  const [mode, setMode] = useState<"write" | "preview">("write");

  const dirty = draft !== lesson.body;

  return (
    <Dialog
      open={open}
      onOpenChange={(next) => {
        setOpen(next);
        if (!next) setMode("write");
      }}
    >
      <DialogTrigger asChild>
        <Button
          size="icon-sm"
          variant="ghost"
          aria-label={
            lesson.body ? `Edit content of ${lesson.title}` : `Write content for ${lesson.title}`
          }
          title={frozen ? "View content" : "Edit content"}
        >
          {frozen ? <BookOpen className="size-3.5" /> : <PenLine className="size-3.5" />}
        </Button>
      </DialogTrigger>
      <DialogContent className="sm:max-w-2xl">
        <form
          onSubmit={(e) => {
            e.preventDefault();
            if (!dirty) return;
            // An explicit empty string clears the body — absent means "don't
            // touch" on this set-only endpoint, so the full value always goes.
            updateLesson.mutate(
              { lessonId: lesson.id, body: draft },
              { onSuccess: () => setOpen(false) },
            );
          }}
        >
          <DialogHeader>
            <DialogTitle className="truncate pr-6">{lesson.title}</DialogTitle>
            <DialogDescription>
              {frozen ? (
                <>This lesson is published, so its content is frozen.</>
              ) : (
                <>
                  Written in markdown — headings, lists, code blocks, tables and links all render on
                  the lesson page.
                </>
              )}
            </DialogDescription>
          </DialogHeader>

          {frozen ? (
            <div className="border-hairline bg-card max-h-[60vh] overflow-y-auto overscroll-contain rounded-sm border p-4">
              {lesson.body ? (
                <Markdown>{lesson.body}</Markdown>
              ) : (
                <p className="text-muted-foreground text-sm">This lesson has no content yet.</p>
              )}
            </div>
          ) : (
            <div className="space-y-2 py-4">
              <div className="flex items-center justify-between">
                {/* Two plain toggles rather than a tab widget: there are exactly
                    two states and neither carries state of its own. */}
                <div className="bg-surface-strong inline-flex rounded-sm p-0.5">
                  {(["write", "preview"] as const).map((m) => (
                    <button
                      key={m}
                      type="button"
                      className={
                        m === mode
                          ? "bg-card text-ink rounded-xs px-3 py-1 text-xs font-medium capitalize shadow-xs"
                          : "text-muted-foreground hover:text-ink rounded-xs px-3 py-1 text-xs capitalize transition-colors"
                      }
                      onClick={() => setMode(m)}
                    >
                      {m}
                    </button>
                  ))}
                </div>
                <span className="text-muted-foreground text-xs">
                  {mode === "write"
                    ? `${draft.length.toLocaleString()} characters`
                    : "Exactly what learners will read"}
                </span>
              </div>

              {mode === "write" ? (
                <Textarea
                  value={draft}
                  onChange={(e) => setDraft(e.target.value)}
                  placeholder={
                    '## Key idea\n\nExplain it here.\n\n- a list\n- of points\n\n```python\nprint("or code")\n```'
                  }
                  className="font-code min-h-[320px] text-xs leading-relaxed"
                  autoFocus
                />
              ) : (
                <div className="border-hairline bg-card max-h-[320px] overflow-y-auto overscroll-contain rounded-sm border p-4">
                  {draft.trim() ? (
                    <Markdown>{draft}</Markdown>
                  ) : (
                    <p className="text-muted-foreground text-sm">Nothing to preview yet.</p>
                  )}
                </div>
              )}
            </div>
          )}

          {!frozen && (
            <DialogFooter>
              <Button type="button" variant="ghost" onClick={() => setOpen(false)}>
                Cancel
              </Button>
              <Button type="submit" disabled={!dirty || updateLesson.isPending}>
                {updateLesson.isPending ? "Saving…" : "Save content"}
              </Button>
            </DialogFooter>
          )}
        </form>
      </DialogContent>
    </Dialog>
  );
};
