"use client";

import { useState } from "react";
import { Check, GripVertical, Pencil, Trash2 } from "lucide-react";

import { Badge, Button } from "@datarango/ui";

import {
  QuestionForm,
  cleanDraft,
  draftFromQuestion,
  type QuestionDraft,
} from "@/components/question-form";
import type { DragHandleProps } from "@/components/sortable";
import {
  QUESTION_KIND_LABELS,
  isChoiceKind,
  useRemoveQuestion,
  useUpdateQuestion,
  type AuthoredQuestion,
} from "@/hooks/assessment";

export const QuestionCard = ({
  quizId,
  question,
  index,
  handle,
  frozen,
}: {
  quizId: string;
  question: AuthoredQuestion;
  index: number;
  handle: DragHandleProps;
  /** Published quizzes are immutable — the backend refuses edits either way. */
  frozen: boolean;
}) => {
  const update = useUpdateQuestion(quizId);
  const remove = useRemoveQuestion(quizId);

  const [editing, setEditing] = useState(false);
  const [draft, setDraft] = useState<QuestionDraft>(() => draftFromQuestion(question));

  const startEditing = () => {
    setDraft(draftFromQuestion(question));
    setEditing(true);
  };

  const save = () => {
    const cleaned = cleanDraft(draft);
    update.mutate(
      {
        questionId: question.id,
        kind: cleaned.kind,
        prompt: cleaned.prompt.trim(),
        points: cleaned.points,
        // Options and the key always travel together: the server validates the
        // merged result, and sending one without the other is how a key ends up
        // pointing at an option that no longer exists.
        options: cleaned.options,
        correct: cleaned.correct,
      },
      { onSuccess: () => setEditing(false) },
    );
  };

  if (editing) {
    return (
      <div className="border-hairline bg-card mb-2 rounded-xs border p-3">
        <QuestionForm
          draft={draft}
          onChange={setDraft}
          onSubmit={save}
          onCancel={() => setEditing(false)}
          submitLabel="Save question"
          pending={update.isPending}
        />
      </div>
    );
  }

  return (
    <div className="border-hairline bg-card group mb-2 rounded-xs border">
      <div className="flex items-center gap-2 px-3 py-2.5">
        <button
          type="button"
          className="text-muted-foreground hover:text-ink cursor-grab rounded-xs p-1 active:cursor-grabbing"
          aria-label={`Reorder question ${index + 1}`}
          {...handle}
        >
          <GripVertical className="size-4" />
        </button>

        <span className="text-muted-foreground w-6 shrink-0 text-xs tabular-nums">
          {String(index + 1).padStart(2, "0")}
        </span>

        <p className="text-ink min-w-0 flex-1 truncate text-sm font-medium">
          {question.prompt || <span className="text-muted-foreground italic">No prompt</span>}
        </p>

        <Badge variant="ghost">{QUESTION_KIND_LABELS[question.kind]}</Badge>
        <span className="text-muted-foreground text-xs tabular-nums">
          {question.points} pt{question.points === 1 ? "" : "s"}
        </span>

        {!frozen && (
          <>
            <Button size="sm" variant="ghost" onClick={startEditing} aria-label="Edit question">
              <Pencil className="size-3.5" />
            </Button>
            <Button
              size="sm"
              variant="ghost"
              onClick={() => remove.mutate({ questionId: question.id })}
              aria-label="Delete question"
            >
              <Trash2 className="size-3.5" />
            </Button>
          </>
        )}
      </div>

      <div className="border-hairline border-t px-3 py-2 pl-12">
        {isChoiceKind(question.kind) ? (
          <ul className="space-y-1">
            {question.options.map((option) => {
              const correct = question.correct.includes(option.id);
              return (
                <li
                  key={option.id}
                  className={
                    correct
                      ? "text-ink flex items-center gap-1.5 text-xs font-medium"
                      : "text-muted-foreground flex items-center gap-1.5 text-xs"
                  }
                >
                  <Check className={correct ? "size-3 shrink-0" : "size-3 shrink-0 opacity-0"} />
                  {option.text}
                </li>
              );
            })}
          </ul>
        ) : (
          <p className="text-muted-foreground text-xs">
            Matches <code className="text-ink font-mono">{question.correct[0]}</code>
          </p>
        )}
      </div>
    </div>
  );
};
