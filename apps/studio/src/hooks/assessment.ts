"use client";

import { useApi } from "@datarango/api";

/**
 * Quiz authoring — the creator half of assessment (`dr.learning.rpc.assessment.*`).
 * The learner half lives in `web`; the two deliberately never share a type,
 * because the difference between them is the answer key.
 *
 * Quizzes are standalone-first: they have their own owner and their own
 * draft → published lifecycle, independent of any course. One definition can then
 * be used three ways — taken from the library, hung off a course as a `quiz`
 * lesson, or set as a module's end-of-module exercise.
 *
 * Like the catalog, every query is `orgScoped: false`: a quiz belongs to its
 * creator, so an org switch must not fragment the cache for data that never
 * varies by org.
 */

export type QuestionKind = "mcq" | "multiSelect" | "shortAnswer" | "codeSnippet";
export type QuizStatus = "draft" | "published";

export interface QuizOption {
  id: string;
  text: string;
}

/** The list row. Question counts aren't on it — the list subject returns quizzes only. */
export interface Quiz {
  id: string;
  ownerId: string;
  title: string;
  description: string;
  status: QuizStatus;
  passThresholdPercent: number;
  /** 0 means unlimited. */
  maxAttempts: number;
  timeLimitSeconds: number | null;
  createdAt: string;
  updatedAt: string;
}

/**
 * A question as its **author** sees it — the take shape plus `correct`.
 *
 * For the choice kinds `correct` holds option ids; for the text kinds it holds a
 * single regular expression the answer is matched against.
 */
export interface AuthoredQuestion {
  id: string;
  position: number;
  kind: QuestionKind;
  prompt: string;
  points: number;
  options: QuizOption[];
  correct: string[];
}

export interface QuizAuthoringView {
  quizId: string;
  title: string;
  description: string;
  status: QuizStatus;
  passThresholdPercent: number;
  maxAttempts: number;
  timeLimitSeconds: number | null;
  pointsAvailable: number;
  /** Attempts already recorded against this quiz, by anyone. */
  attemptsRecorded: number;
  updatedAt: string;
  questions: AuthoredQuestion[];
}

const QUIZZES = ["assessment-quizzes"];
const quizKey = (quizId: string) => ["assessment-quiz-authoring", quizId];

// ── Quizzes ────────────────────────────────────────────────────────────────

export const useMyQuizzes = () =>
  useApi.query<{ quizzes: Quiz[] }>(QUIZZES, "/learning/assessment/quizzes", {
    orgScoped: false,
  });

/**
 * The authoring read — a **different endpoint** from the learner's
 * `/quizzes/{id}`, not a flag on it, because the two differ in what they may
 * disclose. Owner-only on the server: asking for somebody else's quiz answers
 * not-found whether or not it is published.
 */
export const useQuizForAuthoring = (quizId: string) =>
  useApi.query<QuizAuthoringView>(
    quizKey(quizId),
    `/learning/assessment/quizzes/${quizId}/authoring`,
    { orgScoped: false, enabled: !!quizId },
  );

export interface CreateQuizInput {
  title: string;
  description: string;
  passThresholdPercent: number;
  maxAttempts: number;
  timeLimitSeconds: number | null;
}

export const useCreateQuiz = () =>
  useApi.mutation<CreateQuizInput, Quiz>("/learning/assessment/quizzes", {
    invalidates: [QUIZZES],
    toast: { success: "Quiz created" },
  });

/**
 * Set-only edit: an omitted field is left alone. Removing a time limit therefore
 * needs `clearTimeLimit`, since a null would read as "not supplied" — and
 * untimed is a value an author needs to be able to go back to.
 */
export interface UpdateQuizInput {
  title?: string;
  description?: string;
  passThresholdPercent?: number;
  maxAttempts?: number;
  timeLimitSeconds?: number;
  clearTimeLimit?: boolean;
}

export const useUpdateQuiz = (quizId: string) =>
  useApi.mutation<UpdateQuizInput, Quiz>(`/learning/assessment/quizzes/${quizId}`, {
    method: "PATCH",
    invalidates: [QUIZZES, quizKey(quizId)],
  });

/**
 * Publishing is what makes a quiz visible to learners, and it freezes the quiz
 * against every further edit — scores already recorded refer to these questions
 * and their point values. The backend refuses a quiz with no questions
 * (`assessment.no_questions`); it would pass everyone at 0 of 0 points.
 */
export const usePublishQuiz = (quizId: string) =>
  useApi.mutation<void, Quiz>(`/learning/assessment/quizzes/${quizId}/publish`, {
    invalidates: [QUIZZES, quizKey(quizId)],
    toast: { success: "Quiz published" },
  });

// ── Questions ──────────────────────────────────────────────────────────────

export interface AddQuestionInput {
  kind: QuestionKind;
  prompt: string;
  points: number;
  options: QuizOption[];
  correct: string[];
  /** Omitted means append; the server resolves a negative position to last. */
  position?: number;
}

export const useAddQuestion = (quizId: string) =>
  useApi.mutation<AddQuestionInput, AuthoredQuestion>(
    `/learning/assessment/quizzes/${quizId}/questions`,
    { invalidates: [quizKey(quizId)], toast: { success: "Question added" } },
  );

/**
 * Options and `correct` are replaced wholesale when sent, and the server
 * validates the **merged** result — changing an MCQ's options without its key
 * would otherwise leave the key pointing at an option that no longer exists,
 * making the question unanswerable. Send both together.
 */
export interface UpdateQuestionInput {
  questionId: string;
  kind?: QuestionKind;
  prompt?: string;
  points?: number;
  options?: QuizOption[];
  correct?: string[];
}

export const useUpdateQuestion = (quizId: string) =>
  useApi.mutation<UpdateQuestionInput, AuthoredQuestion>(
    (v) => `/learning/assessment/questions/${v.questionId}`,
    { method: "PATCH", invalidates: [quizKey(quizId)] },
  );

export const useRemoveQuestion = (quizId: string) =>
  useApi.mutation<{ questionId: string }, { removed: boolean }>(
    (v) => `/learning/assessment/questions/${v.questionId}`,
    {
      method: "DELETE",
      invalidates: [quizKey(quizId)],
      toast: { success: "Question removed" },
    },
  );

/** The id list must be a full permutation — the backend rejects partial lists. */
export const useReorderQuestions = (quizId: string) =>
  useApi.mutation<{ questionIds: string[] }, { reordered: number }>(
    `/learning/assessment/quizzes/${quizId}/questions/reorder`,
    { invalidates: [quizKey(quizId)] },
  );

// ── Helpers ────────────────────────────────────────────────────────────────

export const QUESTION_KIND_LABELS: Record<QuestionKind, string> = {
  mcq: "Multiple choice",
  multiSelect: "Multi-select",
  shortAnswer: "Short answer",
  codeSnippet: "Code snippet",
};

/** True for the kinds whose answer key is option ids rather than a pattern. */
export const isChoiceKind = (kind: QuestionKind) => kind === "mcq" || kind === "multiSelect";
