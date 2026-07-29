"use client";

import { useMemo, useState } from "react";
import { AlertTriangle, GripVertical, Plus, Trash2 } from "lucide-react";

import { Badge, Button, Input } from "@datarango/ui";

import { InlineEdit } from "@/components/inline-edit";
import { SortableItem, SortableList, type DragHandleProps } from "@/components/sortable";
import {
  useAddLesson,
  useRemoveLesson,
  useReorderLessons,
  useUpdateLesson,
  useUpdateModule,
  type CourseTreeModule,
  type LessonKind,
} from "@/hooks/catalog";

const LESSON_KINDS: LessonKind[] = ["text", "video", "audio", "quiz"];

export const ModuleCard = ({
  courseId,
  module,
  index,
  handle,
  onRemove,
  frozen,
}: {
  courseId: string;
  module: CourseTreeModule;
  index: number;
  handle: DragHandleProps;
  onRemove: () => void;
  /** Published courses are immutable — the backend refuses edits either way. */
  frozen: boolean;
}) => {
  const updateModule = useUpdateModule(courseId);
  const addLesson = useAddLesson(courseId);
  const updateLesson = useUpdateLesson(courseId);
  const removeLesson = useRemoveLesson(courseId);
  const reorderLessons = useReorderLessons(courseId);

  const [newLessonTitle, setNewLessonTitle] = useState("");
  const [newLessonKind, setNewLessonKind] = useState<LessonKind>("text");
  const [pendingOrder, setPendingOrder] = useState<string[] | null>(null);

  // A pending drag order wins until the refetch lands. If the lesson set itself
  // changed (add/remove) the override is stale, so fall back to the server list.
  const lessons = useMemo(() => {
    if (!pendingOrder) return module.lessons;
    const byId = new Map(module.lessons.map((l) => [l.id, l]));
    const ordered = pendingOrder.flatMap((id) => byId.get(id) ?? []);
    return ordered.length === module.lessons.length ? ordered : module.lessons;
  }, [module.lessons, pendingOrder]);

  const reorder = (idsInOrder: string[]) => {
    setPendingOrder(idsInOrder);
    reorderLessons.mutate(
      { moduleId: module.id, lessonIdsInOrder: idsInOrder },
      { onSettled: () => setPendingOrder(null) },
    );
  };

  const submitLesson = (e: React.FormEvent) => {
    e.preventDefault();
    const title = newLessonTitle.trim();
    if (!title) return;
    addLesson.mutate(
      { moduleId: module.id, kind: newLessonKind, title, body: "", position: lessons.length },
      { onSuccess: () => setNewLessonTitle("") },
    );
  };

  return (
    <div className="border-hairline bg-card mb-3 rounded-xs border">
      <div className="border-hairline flex items-center gap-2 border-b px-3 py-2.5">
        <button
          type="button"
          className="text-muted-foreground hover:text-ink cursor-grab rounded-xs p-1 active:cursor-grabbing"
          aria-label={`Reorder ${module.title}`}
          {...handle}
        >
          <GripVertical className="size-4" />
        </button>

        <span className="text-muted-foreground w-6 shrink-0 text-xs tabular-nums">
          {String(index + 1).padStart(2, "0")}
        </span>

        <div className="min-w-0 flex-1">
          {frozen ? (
            <span className="text-ink truncate text-sm font-medium">{module.title}</span>
          ) : (
            <InlineEdit
              value={module.title}
              ariaLabel={`Module ${index + 1} title`}
              className="text-ink w-full text-sm font-medium"
              onCommit={(title) => updateModule.mutate({ moduleId: module.id, title })}
            />
          )}
        </div>

        {module.exerciseId ? (
          <Badge variant="success">Exercise set</Badge>
        ) : (
          <Badge variant="outline" className="gap-1">
            <AlertTriangle className="size-3" />
            No exercise
          </Badge>
        )}

        <span className="text-muted-foreground text-xs">
          {lessons.length} lesson{lessons.length === 1 ? "" : "s"}
        </span>

        {!frozen && (
          <Button
            size="sm"
            variant="ghost"
            onClick={onRemove}
            aria-label={`Delete ${module.title}`}
          >
            <Trash2 className="size-4" />
          </Button>
        )}
      </div>

      <div className="px-3 py-2">
        {lessons.length === 0 ? (
          <p className="text-muted-foreground py-2 text-center text-xs">No lessons yet.</p>
        ) : (
          <SortableList ids={lessons.map((l) => l.id)} onReorder={reorder}>
            {lessons.map((lesson) => (
              <SortableItem key={lesson.id} id={lesson.id}>
                {(lessonHandle) => (
                  <div className="hover:bg-muted/40 group flex items-center gap-2 rounded-xs py-1.5 pr-1 pl-1 transition-colors">
                    <button
                      type="button"
                      className="text-muted-foreground hover:text-ink cursor-grab rounded-xs p-1 active:cursor-grabbing"
                      aria-label={`Reorder ${lesson.title}`}
                      {...lessonHandle}
                    >
                      <GripVertical className="size-3.5" />
                    </button>

                    <Badge variant="ghost" className="w-14 justify-center capitalize">
                      {lesson.kind}
                    </Badge>

                    <div className="min-w-0 flex-1">
                      {frozen ? (
                        <span className="truncate text-sm">{lesson.title}</span>
                      ) : (
                        <InlineEdit
                          value={lesson.title}
                          ariaLabel={`Lesson ${lesson.title} title`}
                          className="w-full text-sm"
                          onCommit={(title) => updateLesson.mutate({ lessonId: lesson.id, title })}
                        />
                      )}
                    </div>

                    {!frozen && (
                      <Button
                        size="sm"
                        variant="ghost"
                        className="opacity-0 transition-opacity group-hover:opacity-100 focus-visible:opacity-100"
                        onClick={() => removeLesson.mutate({ lessonId: lesson.id })}
                        aria-label={`Delete ${lesson.title}`}
                      >
                        <Trash2 className="size-3.5" />
                      </Button>
                    )}
                  </div>
                )}
              </SortableItem>
            ))}
          </SortableList>
        )}

        {!frozen && (
          <form onSubmit={submitLesson} className="mt-2 flex items-center gap-2">
            <select
              className="border-input bg-background h-8 rounded-xs border px-2 text-sm capitalize"
              value={newLessonKind}
              onChange={(e) => setNewLessonKind(e.target.value as LessonKind)}
              aria-label="New lesson kind"
            >
              {LESSON_KINDS.map((kind) => (
                <option key={kind} value={kind}>
                  {kind}
                </option>
              ))}
            </select>
            <Input
              className="h-8 flex-1"
              placeholder="Add a lesson…"
              value={newLessonTitle}
              onChange={(e) => setNewLessonTitle(e.target.value)}
              aria-label="New lesson title"
            />
            <Button
              type="submit"
              size="sm"
              variant="outline"
              disabled={!newLessonTitle.trim() || addLesson.isPending}
            >
              <Plus className="size-3.5" />
              Add
            </Button>
          </form>
        )}
      </div>
    </div>
  );
};
