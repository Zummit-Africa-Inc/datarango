"use client";

import { useApi } from "@datarango/api";

/**
 * Quiz taking. Authoring lives in studio; this is the learner half.
 *
 * The take view deliberately has nowhere to put a correct answer — the backend
 * projects a separate shape rather than serialising the question entity, since
 * a learner is legitimately allowed to read the question but not its key. Don't
 * add a `correct` field here expecting the server to fill it.
 */

export type QuestionKind = "mcq" | "multiSelect" | "shortAnswer" | "codeSnippet";

/**
 * Where the attempt is being taken from. This is not bookkeeping: only the
 * course-bound contexts advance progress, and passing a quiz standalone
 * deliberately does not complete that same quiz inside a course.
 */
export type AttemptContext = "standalone" | "lesson" | "moduleExercise";

export interface QuizOption {
  id: string;
  text: string;
}

export interface QuizQuestion {
  id: string;
  position: number;
  kind: QuestionKind;
  prompt: string;
  points: number;
  options: QuizOption[];
}

export interface QuizTakeView {
  quizId: string;
  title: string;
  description: string;
  passThresholdPercent: number;
  /** 0 means unlimited. */
  maxAttempts: number;
  timeLimitSeconds: number | null;
  attemptsUsed: number;
  pointsAvailable: number;
  questions: QuizQuestion[];
}

export interface GradedAnswer {
  questionId: string;
  correct: boolean;
  pointsAwarded: number;
  pointsAvailable: number;
}

export interface AttemptResult {
  attemptId: string;
  quizId: string;
  passed: boolean;
  scorePercent: number;
  pointsAwarded: number;
  pointsAvailable: number;
  attemptsUsed: number;
  /** False for a standalone pass, however good the score. */
  courseProgressAdvanced: boolean;
  answers: GradedAnswer[];
}

export interface SubmitQuizInput {
  context: AttemptContext;
  courseId?: string;
  courseVersionId?: string;
  lessonId?: string;
  moduleId?: string;
  /** Question id → selected option ids, or a single-element array of text. */
  responses: Record<string, string[]>;
}

const quizKey = (quizId: string) => ["assessment-quiz", quizId];

export const useQuiz = (quizId: string) =>
  useApi.query<QuizTakeView>(quizKey(quizId), `/learning/assessment/quizzes/${quizId}`, {
    orgScoped: false,
    enabled: !!quizId,
    // Attempts-used is part of this payload, so it must not be served stale
    // after a submission.
    staleTime: 0,
  });

export const useSubmitQuiz = (quizId: string) =>
  useApi.mutation<SubmitQuizInput, AttemptResult>(
    `/learning/assessment/quizzes/${quizId}/submit`,
    {
      invalidates: [quizKey(quizId), ["learning-progress"], ["learning-certificates"]],
      // The result screen reports pass or fail itself; a toast would either
      // duplicate it or, worse, celebrate a failure.
      toast: { success: undefined },
    },
  );
