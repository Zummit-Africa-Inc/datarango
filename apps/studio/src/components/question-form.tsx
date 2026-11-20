"use client";

import { useState } from "react";
import { Plus, Trash2 } from "lucide-react";

import { CodeEditor } from "@datarango/notebook";
import { Button, Checkbox, Input, Label, Textarea } from "@datarango/ui";

import {
  QUESTION_KIND_LABELS,
  isChoiceKind,
  type AuthoredQuestion,
  type QuestionKind,
  type QuizOption,
} from "@/hooks/assessment";

const KINDS: QuestionKind[] = ["mcq", "multiSelect", "shortAnswer", "codeSnippet", "notebook"];

const TEST_TEMPLATE = `# Runs after the learner's code, in the same namespace.
# Each test_* function is one test; an assert message is what the learner sees.

def test_example():
    assert add(1, 2) == 3, "add(1, 2) should be 3"
`;

export interface QuestionDraft {
  kind: QuestionKind;
  prompt: string;
  points: number;
  options: QuizOption[];
  correct: string[];
  requiresManualGrading: boolean;
  starterCode: string;
}

/** Option ids only have to be unique within their question, so a letter is plenty. */
const nextOptionId = (options: QuizOption[]) => {
  const used = new Set(options.map((o) => o.id));
  for (let i = 0; i < 26; i++) {
    const id = String.fromCharCode(97 + i);
    if (!used.has(id)) return id;
  }
  return `o${options.length + 1}`;
};

export const emptyDraft = (): QuestionDraft => ({
  kind: "mcq",
  prompt: "",
  points: 1,
  options: [
    { id: "a", text: "" },
    { id: "b", text: "" },
  ],
  correct: [],
  requiresManualGrading: false,
  starterCode: "",
});

export const draftFromQuestion = (question: AuthoredQuestion): QuestionDraft => ({
  kind: question.kind,
  prompt: question.prompt,
  points: question.points,
  options: question.options.length > 0 ? question.options : [{ id: "a", text: "" }],
  correct: question.correct,
  requiresManualGrading: question.requiresManualGrading ?? false,
  starterCode: question.starterCode ?? "",
});

/**
 * Is this draft something the server will accept? Mirrors the backend's
 * validation so a creator finds out before the round trip — but the server still
 * checks, and its answer is the one that counts.
 */
export const draftProblem = (draft: QuestionDraft): string | null => {
  if (!draft.prompt.trim()) return "Give the question a prompt.";

  if (draft.kind === "notebook") {
    const tests = draft.correct[0]?.trim() ?? "";
    if (!tests) {
      return draft.requiresManualGrading ? null : "Write the tests, or mark this one yourself.";
    }
    return tests.includes("def test_") ? null : "The tests need at least one test_* function.";
  }

  // A manually-graded question is the one case with no key to validate — the
  // usual "needs an answer" rule is inverted, so it returns before reaching it.
  if (draft.requiresManualGrading) {
    return isChoiceKind(draft.kind)
      ? "A choice question is graded by its options — turn off manual marking."
      : null;
  }

  if (isChoiceKind(draft.kind)) {
    const filled = draft.options.filter((o) => o.text.trim());
    if (filled.length < 2) return "A choice question needs at least two options.";
    if (draft.correct.length === 0) return "Mark which option is correct.";
    if (draft.kind === "mcq" && draft.correct.length !== 1) {
      return "Multiple choice takes exactly one correct option.";
    }
    if (!draft.correct.every((id) => filled.some((o) => o.id === id))) {
      return "A correct option was removed — mark the answer again.";
    }
    return null;
  }

  return draft.correct[0]?.trim() ? null : "Give the answer pattern.";
};

/** Drops blank options so a half-filled row never reaches the answer key. */
export const cleanDraft = (draft: QuestionDraft): QuestionDraft => {
  // Notebook questions may carry tests *and* a reviewer (hybrid); blank tests
  // on a reviewed one just mean "review only".
  if (draft.kind === "notebook") {
    const tests = draft.correct[0] ?? "";
    return { ...draft, options: [], correct: tests.trim() ? [tests] : [] };
  }
  // The server refuses a manual question that also carries a key, so the key is
  // dropped here rather than sent and bounced.
  if (draft.requiresManualGrading) {
    return { ...draft, options: [], correct: [] };
  }
  if (!isChoiceKind(draft.kind)) {
    return { ...draft, options: [], correct: [draft.correct[0]?.trim() ?? ""] };
  }
  const options = draft.options.filter((o) => o.text.trim());
  return {
    ...draft,
    options,
    correct: draft.correct.filter((id) => options.some((o) => o.id === id)),
  };
};

/**
 * The question editor, shared by the add form and the edit-in-place state.
 *
 * The answer key is edited here alongside the question, which is only possible
 * because this whole screen is served by the authoring endpoint — the learner's
 * copy of a question has nowhere to put a correct answer at all.
 */
export const QuestionForm = ({
  draft,
  onChange,
  onSubmit,
  onCancel,
  submitLabel,
  pending,
}: {
  draft: QuestionDraft;
  onChange: (next: QuestionDraft) => void;
  onSubmit: () => void;
  onCancel?: () => void;
  submitLabel: string;
  pending: boolean;
}) => {
  const [showProblem, setShowProblem] = useState(false);
  const problem = draftProblem(draft);

  const setKind = (kind: QuestionKind) => {
    // Switching between a choice kind and a text kind makes the old key
    // meaningless — option ids are not patterns and vice versa — so it is
    // dropped rather than carried across and silently mis-graded.
    // A notebook question's key is a test file — no other kind's key carries over.
    const crossing =
      isChoiceKind(kind) !== isChoiceKind(draft.kind) ||
      (kind === "notebook") !== (draft.kind === "notebook");
    onChange({
      ...draft,
      kind,
      correct:
        kind === "notebook" && crossing
          ? [TEST_TEMPLATE]
          : crossing
            ? []
            : kind === "mcq"
              ? draft.correct.slice(0, 1)
              : draft.correct,
      // Moving to a choice kind turns manual marking off rather than leaving an
      // invalid combination for the submit to reject: choice questions grade
      // themselves and the server refuses the pairing outright.
      requiresManualGrading: isChoiceKind(kind) ? false : draft.requiresManualGrading,
    });
  };

  const toggleCorrect = (optionId: string) => {
    if (draft.kind === "mcq") {
      onChange({ ...draft, correct: [optionId] });
      return;
    }
    onChange({
      ...draft,
      correct: draft.correct.includes(optionId)
        ? draft.correct.filter((id) => id !== optionId)
        : [...draft.correct, optionId],
    });
  };

  const submit = (e: React.FormEvent) => {
    e.preventDefault();
    if (problem) {
      setShowProblem(true);
      return;
    }
    onSubmit();
  };

  return (
    <form onSubmit={submit} className="space-y-3">
      <div className="flex flex-wrap items-end gap-3">
        <div className="space-y-1.5">
          <Label htmlFor="question-kind">Type</Label>
          <select
            id="question-kind"
            className="border-input bg-background h-9 rounded-xs border px-2 text-sm"
            value={draft.kind}
            onChange={(e) => setKind(e.target.value as QuestionKind)}
          >
            {KINDS.map((kind) => (
              <option key={kind} value={kind}>
                {QUESTION_KIND_LABELS[kind]}
              </option>
            ))}
          </select>
        </div>

        <div className="w-24 space-y-1.5">
          <Label htmlFor="question-points">Points</Label>
          <Input
            id="question-points"
            type="number"
            min={1}
            value={draft.points}
            onChange={(e) =>
              onChange({ ...draft, points: Math.max(1, Number(e.target.value) || 1) })
            }
          />
        </div>
      </div>

      <div className="space-y-1.5">
        <Label htmlFor="question-prompt">Prompt</Label>
        <Textarea
          id="question-prompt"
          rows={draft.kind === "notebook" ? 5 : 2}
          value={draft.prompt}
          onChange={(e) => onChange({ ...draft, prompt: e.target.value })}
          placeholder={
            draft.kind === "notebook"
              ? "Describe the task. Markdown works: `code`, lists, tables."
              : "What are you asking?"
          }
        />
      </div>

      {draft.kind === "notebook" ? (
        <NotebookFields draft={draft} onChange={onChange} />
      ) : isChoiceKind(draft.kind) ? (
        <div className="space-y-2">
          <Label>
            Options
            <span className="text-muted-foreground ml-2 font-normal">
              {draft.kind === "mcq"
                ? "tick the one correct answer"
                : "tick every correct answer — a learner has to select exactly this set"}
            </span>
          </Label>

          {draft.options.map((option, index) => (
            <div key={option.id} className="flex items-center gap-2">
              <Checkbox
                checked={draft.correct.includes(option.id)}
                onCheckedChange={() => toggleCorrect(option.id)}
                aria-label={`Option ${index + 1} is correct`}
              />
              <Input
                className="flex-1"
                value={option.text}
                placeholder={`Option ${index + 1}`}
                aria-label={`Option ${index + 1} text`}
                onChange={(e) =>
                  onChange({
                    ...draft,
                    options: draft.options.map((o) =>
                      o.id === option.id ? { ...o, text: e.target.value } : o,
                    ),
                  })
                }
              />
              <Button
                type="button"
                size="sm"
                variant="ghost"
                aria-label={`Remove option ${index + 1}`}
                disabled={draft.options.length <= 2}
                onClick={() =>
                  onChange({
                    ...draft,
                    options: draft.options.filter((o) => o.id !== option.id),
                    // Removing the marked answer must clear it, not leave a key
                    // pointing at an option that no longer exists.
                    correct: draft.correct.filter((id) => id !== option.id),
                  })
                }
              >
                <Trash2 className="size-3.5" />
              </Button>
            </div>
          ))}

          <Button
            type="button"
            size="sm"
            variant="outline"
            onClick={() =>
              onChange({
                ...draft,
                options: [...draft.options, { id: nextOptionId(draft.options), text: "" }],
              })
            }
          >
            <Plus className="size-3.5" />
            Add option
          </Button>
        </div>
      ) : (
        <div className="space-y-3">
          {/*
            The choice is between a pattern and a person. Offered only on the
            text kinds, because a choice question already grades itself and
            putting a human in that loop costs the learner a wait for nothing.
          */}
          <label className="flex items-start gap-2">
            <Checkbox
              className="mt-0.5"
              checked={draft.requiresManualGrading}
              onCheckedChange={(checked) =>
                onChange({ ...draft, requiresManualGrading: checked === true })
              }
            />
            <span className="text-sm">
              I&apos;ll mark this one myself
              <span className="text-muted-foreground block text-xs">
                For answers a pattern can&apos;t judge — an explanation, a design, a bit of
                reasoning. Submissions wait in your grading queue, and the learner isn&apos;t told
                pass or fail until you&apos;ve marked it.
              </span>
            </span>
          </label>

          {!draft.requiresManualGrading && (
            <div className="space-y-1.5">
              <Label htmlFor="question-pattern">Answer pattern</Label>
              <Input
                id="question-pattern"
                className="font-mono"
                value={draft.correct[0] ?? ""}
                onChange={(e) => onChange({ ...draft, correct: [e.target.value] })}
                placeholder="^pandas$"
              />
              <p className="text-muted-foreground text-xs">
                A regular expression. Matching ignores case and trims surrounding whitespace, so{" "}
                <code className="font-mono">^pandas$</code> accepts{" "}
                <code className="font-mono">{" PANDAS "}</code>. Anchor it with{" "}
                <code className="font-mono">^</code> and <code className="font-mono">$</code> unless
                you mean to match a substring.
              </p>
            </div>
          )}
        </div>
      )}

      {showProblem && problem && (
        <p className="text-destructive text-sm" role="alert">
          {problem}
        </p>
      )}

      <div className="flex items-center gap-2">
        <Button type="submit" size="sm" disabled={pending}>
          {pending ? "Saving…" : submitLabel}
        </Button>
        {onCancel && (
          <Button type="button" size="sm" variant="ghost" onClick={onCancel}>
            Cancel
          </Button>
        )}
      </div>
    </form>
  );
};

/**
 * The notebook half of the form: what the learner starts from, the hidden
 * tests that score them, and whether a person reviews the code as well.
 */
const NotebookFields = ({
  draft,
  onChange,
}: {
  draft: QuestionDraft;
  onChange: (next: QuestionDraft) => void;
}) => (
  <div className="space-y-3">
    <div className="space-y-1.5">
      <Label>
        Starter code
        <span className="text-muted-foreground ml-2 font-normal">
          what the learner&apos;s editor opens with — never the answer
        </span>
      </Label>
      <div className="border-hairline bg-muted/40 overflow-hidden rounded-xs border">
        <CodeEditor
          value={draft.starterCode}
          language="python"
          onChange={(starterCode) => onChange({ ...draft, starterCode })}
          placeholder={"def add(a, b):\n    ..."}
        />
      </div>
    </div>

    <div className="space-y-1.5">
      <Label>
        Hidden tests
        <span className="text-muted-foreground ml-2 font-normal">
          learners see each test&apos;s name and result, never this code
        </span>
      </Label>
      <div className="border-hairline bg-muted/40 overflow-hidden rounded-xs border">
        <CodeEditor
          value={draft.correct[0] ?? ""}
          language="python"
          onChange={(tests) => onChange({ ...draft, correct: [tests] })}
          placeholder="def test_something():"
        />
      </div>
      <p className="text-muted-foreground text-xs">
        Points are split across tests: passing 2 of 3 earns two thirds, rounded down.
      </p>
    </div>

    <label className="flex items-start gap-2">
      <Checkbox
        className="mt-0.5"
        checked={draft.requiresManualGrading}
        onCheckedChange={(checked) =>
          onChange({ ...draft, requiresManualGrading: checked === true })
        }
      />
      <span className="text-sm">
        I&apos;ll review the code too
        <span className="text-muted-foreground block text-xs">
          With tests, they score it first and the submission then waits in your grading queue with
          the test report, where you set the final mark. Without tests, you mark it alone.
        </span>
      </span>
    </label>
  </div>
);
