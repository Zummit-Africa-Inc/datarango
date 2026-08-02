"use client";

import { useMemo, useState } from "react";
import { useParams } from "next/navigation";
import Link from "next/link";
import { ArrowLeft, Plus } from "lucide-react";

import { Badge, Button, Input, Label, PageLayout, Skeleton } from "@datarango/ui";

import {
  QuestionForm,
  cleanDraft,
  emptyDraft,
  type QuestionDraft,
} from "@/components/question-form";
import { QuestionCard } from "@/components/question-card";
import { SortableItem, SortableList } from "@/components/sortable";
import {
  useAddQuestion,
  usePublishQuiz,
  useQuizForAuthoring,
  useReorderQuestions,
  useUpdateQuiz,
} from "@/hooks/assessment";

export default function QuizBuilderPage() {
  const params = useParams<{ quizId: string }>();
  const quizId = params.quizId;

  const { data: quiz, isLoading } = useQuizForAuthoring(quizId);
  const addQuestion = useAddQuestion(quizId);
  const reorder = useReorderQuestions(quizId);
  const updateQuiz = useUpdateQuiz(quizId);
  const publish = usePublishQuiz(quizId);

  const [adding, setAdding] = useState(false);
  const [draft, setDraft] = useState<QuestionDraft>(emptyDraft);
  const [pendingOrder, setPendingOrder] = useState<string[] | null>(null);

  const serverQuestions = useMemo(() => quiz?.questions ?? [], [quiz]);

  // A pending drag order wins until the refetch lands. If the question set itself
  // changed (add/remove) the override is stale, so defer to the server list.
  const questions = useMemo(() => {
    if (!pendingOrder) return serverQuestions;
    const byId = new Map(serverQuestions.map((q) => [q.id, q]));
    const ordered = pendingOrder.flatMap((id) => byId.get(id) ?? []);
    return ordered.length === serverQuestions.length ? ordered : serverQuestions;
  }, [serverQuestions, pendingOrder]);

  const frozen = quiz?.status === "published";

  const applyOrder = (idsInOrder: string[]) => {
    setPendingOrder(idsInOrder);
    reorder.mutate({ questionIds: idsInOrder }, { onSettled: () => setPendingOrder(null) });
  };

  const submitQuestion = () => {
    const cleaned = cleanDraft(draft);
    addQuestion.mutate(
      {
        kind: cleaned.kind,
        prompt: cleaned.prompt.trim(),
        points: cleaned.points,
        options: cleaned.options,
        correct: cleaned.correct,
      },
      {
        onSuccess: () => {
          setDraft(emptyDraft());
          setAdding(false);
        },
      },
    );
  };

  if (isLoading) {
    return (
      <PageLayout title="Quiz" subtitle="Loading…">
        <Skeleton skeleton="table" rows={4} columns={3} />
      </PageLayout>
    );
  }

  if (!quiz) {
    return (
      <PageLayout title="Quiz not found" subtitle="It may have been deleted.">
        <Button asChild variant="outline">
          <Link href="/quizzes">Back to quizzes</Link>
        </Button>
      </PageLayout>
    );
  }

  return (
    <PageLayout
      title={quiz.title}
      subtitle={quiz.description || "No description yet."}
      actions={[
        <Badge key="status" variant={frozen ? "success" : "outline"}>
          {frozen ? "Published" : "Draft"}
        </Badge>,
        <Button
          key="publish"
          disabled={frozen || questions.length === 0 || publish.isPending}
          onClick={() => publish.mutate()}
        >
          {publish.isPending ? "Publishing…" : "Publish"}
        </Button>,
      ]}
    >
      <Link
        href="/quizzes"
        className="text-muted-foreground hover:text-ink inline-flex items-center gap-1 text-sm transition-colors"
      >
        <ArrowLeft className="size-3.5" />
        All quizzes
      </Link>

      {frozen ? (
        <div className="border-hairline bg-muted/40 rounded-xs border px-4 py-3 text-sm">
          <p className="text-ink font-medium">This quiz is published and frozen</p>
          <p className="text-muted-foreground mt-1">
            {quiz.attemptsRecorded > 0
              ? `${quiz.attemptsRecorded} attempt${quiz.attemptsRecorded === 1 ? "" : "s"} have been graded against these questions and their point values — editing them in place would rewrite what those scores meant. Create a new quiz instead.`
              : "Editing questions in place would change what any recorded score meant. Create a new quiz instead."}
          </p>
        </div>
      ) : (
        <QuizSettings
          passThresholdPercent={quiz.passThresholdPercent}
          maxAttempts={quiz.maxAttempts}
          timeLimitSeconds={quiz.timeLimitSeconds}
          pending={updateQuiz.isPending}
          onSave={(next) => updateQuiz.mutate(next)}
        />
      )}

      {!frozen && questions.length === 0 && (
        <div className="border-hairline bg-muted/40 rounded-xs border px-4 py-3 text-sm">
          <p className="text-ink font-medium">Not ready to publish</p>
          <p className="text-muted-foreground mt-1">
            A quiz needs at least one question — an empty one would pass every learner at 0 of 0
            points.
          </p>
        </div>
      )}

      <div>
        <div className="mb-2 flex items-baseline justify-between">
          <h2 className="font-heading text-ink text-sm font-medium">
            Questions{" "}
            <span className="text-muted-foreground font-normal">
              {questions.length} · {quiz.pointsAvailable} point
              {quiz.pointsAvailable === 1 ? "" : "s"} available · pass at{" "}
              {quiz.passThresholdPercent}%
            </span>
          </h2>
        </div>

        {questions.length === 0 ? (
          <div className="border-hairline bg-card rounded-xs border px-6 py-10 text-center">
            <p className="text-muted-foreground text-sm">No questions yet.</p>
          </div>
        ) : (
          <SortableList ids={questions.map((q) => q.id)} onReorder={applyOrder}>
            {questions.map((question, index) => (
              <SortableItem key={question.id} id={question.id}>
                {(handle) => (
                  <QuestionCard
                    quizId={quizId}
                    question={question}
                    index={index}
                    handle={handle}
                    frozen={!!frozen}
                  />
                )}
              </SortableItem>
            ))}
          </SortableList>
        )}
      </div>

      {!frozen &&
        (adding ? (
          <div className="border-hairline bg-card rounded-xs border p-3">
            <QuestionForm
              draft={draft}
              onChange={setDraft}
              onSubmit={submitQuestion}
              onCancel={() => {
                setAdding(false);
                setDraft(emptyDraft());
              }}
              submitLabel="Add question"
              pending={addQuestion.isPending}
            />
          </div>
        ) : (
          <Button variant="outline" onClick={() => setAdding(true)}>
            <Plus className="size-4" />
            Add question
          </Button>
        ))}
    </PageLayout>
  );
}

/**
 * The three rules that decide whether an attempt passes. Editable only while the
 * quiz is a draft — changing the pass mark under a recorded score would rewrite
 * history, which is why publishing freezes it.
 */
const QuizSettings = ({
  passThresholdPercent,
  maxAttempts,
  timeLimitSeconds,
  pending,
  onSave,
}: {
  passThresholdPercent: number;
  maxAttempts: number;
  timeLimitSeconds: number | null;
  pending: boolean;
  onSave: (next: {
    passThresholdPercent?: number;
    maxAttempts?: number;
    timeLimitSeconds?: number;
    clearTimeLimit?: boolean;
  }) => void;
}) => {
  const [threshold, setThreshold] = useState(String(passThresholdPercent));
  const [attempts, setAttempts] = useState(String(maxAttempts));
  const [minutes, setMinutes] = useState(
    timeLimitSeconds === null ? "" : String(Math.round(timeLimitSeconds / 60)),
  );

  const thresholdValue = Number(threshold);
  const attemptsValue = Number(attempts);
  const minutesValue = Number(minutes);
  const valid =
    Number.isInteger(thresholdValue) &&
    thresholdValue >= 0 &&
    thresholdValue <= 100 &&
    Number.isInteger(attemptsValue) &&
    attemptsValue >= 0;

  const changed =
    thresholdValue !== passThresholdPercent ||
    attemptsValue !== maxAttempts ||
    (minutes.trim() ? minutesValue * 60 : null) !== timeLimitSeconds;

  const save = (e: React.FormEvent) => {
    e.preventDefault();
    if (!valid) return;
    const wantsUntimed = !minutes.trim() || minutesValue <= 0;
    onSave({
      passThresholdPercent: thresholdValue,
      maxAttempts: attemptsValue,
      // Untimed is a value, not an absent one, so it has to be said explicitly —
      // an omitted field means "leave alone" on this endpoint.
      ...(wantsUntimed ? { clearTimeLimit: true } : { timeLimitSeconds: minutesValue * 60 }),
    });
  };

  return (
    <form onSubmit={save} className="border-hairline bg-card rounded-xs border p-3">
      <div className="flex flex-wrap items-end gap-3">
        <div className="w-28 space-y-1.5">
          <Label htmlFor="settings-threshold">Pass mark %</Label>
          <Input
            id="settings-threshold"
            type="number"
            min={0}
            max={100}
            value={threshold}
            onChange={(e) => setThreshold(e.target.value)}
          />
        </div>
        <div className="w-28 space-y-1.5">
          <Label htmlFor="settings-attempts">Attempts</Label>
          <Input
            id="settings-attempts"
            type="number"
            min={0}
            value={attempts}
            onChange={(e) => setAttempts(e.target.value)}
          />
        </div>
        <div className="w-32 space-y-1.5">
          <Label htmlFor="settings-minutes">Time limit</Label>
          <Input
            id="settings-minutes"
            type="number"
            min={0}
            placeholder="—"
            value={minutes}
            onChange={(e) => setMinutes(e.target.value)}
          />
        </div>
        <Button type="submit" size="sm" variant="outline" disabled={!valid || !changed || pending}>
          {pending ? "Saving…" : "Save rules"}
        </Button>
        <p className="text-muted-foreground text-xs">0 attempts = unlimited · blank = untimed</p>
      </div>
    </form>
  );
};
