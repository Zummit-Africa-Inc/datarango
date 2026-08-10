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

/**
 * Whether an attempt has been fully scored.
 *
 * `pendingReview` means a question is with a human and the attempt has **no
 * verdict** — `passed` is false because nothing has been decided, not because
 * the learner got it wrong. Branch on this, never on `passed` alone.
 */
export type AttemptStatus = "graded" | "pendingReview";

export interface GradedAnswer {
  questionId: string;
  correct: boolean;
  pointsAwarded: number;
  pointsAvailable: number;
  /**
   * This answer is with a grader. `correct: false` here is the absence of a
   * verdict, so rendering it with a cross tells the learner they got it wrong
   * before anybody has read it.
   */
  awaitingReview: boolean;
}

export interface AttemptResult {
  attemptId: string;
  quizId: string;
  passed: boolean;
  /**
   * While `status` is `pendingReview` this is only the floor the auto-graded
   * questions already earned — it can only rise.
   */
  scorePercent: number;
  pointsAwarded: number;
  pointsAvailable: number;
  attemptsUsed: number;
  /** False for a standalone pass, however good the score. */
  courseProgressAdvanced: boolean;
  answers: GradedAnswer[];
  status: AttemptStatus;
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

/**
 * A published quiz as the library lists it, with **this learner's** standing on
 * it folded in — attempts are user-owned, so these fields can only ever be the
 * caller's own.
 *
 * `bestScorePercent` is null when they have never submitted. That is not the
 * same as a zero and must not be rendered as one.
 *
 * There is no `ownerId` here on purpose: the server projects rather than
 * serialising the quiz entity, so browsing the library does not hand out a set
 * of creator user ids.
 */
export interface QuizLibraryItem {
  quizId: string;
  title: string;
  description: string;
  passThresholdPercent: number;
  /** 0 means unlimited. */
  maxAttempts: number;
  timeLimitSeconds: number | null;
  questionCount: number;
  pointsAvailable: number;
  updatedAt: string;
  attemptsUsed: number;
  bestScorePercent: number | null;
  passed: boolean;
  /**
   * A submission is sitting with a grader. Distinct from both "not attempted"
   * and "attempted and scored" — the card must offer to wait rather than to
   * retry, and `bestScorePercent` stays null because a pending attempt has no
   * score to be the best of.
   */
  awaitingReview: boolean;
}

export interface QuizLibraryPage {
  quizzes: QuizLibraryItem[];
  total: number;
}

/**
 * One recorded attempt, as the history returns it. User-owned under RLS, so
 * this can only ever be the caller's own.
 *
 * `contextKind` is worth keeping: a standalone pass and a module-exercise pass
 * look identical by score and mean quite different things.
 */
export interface QuizAttempt {
  id: string;
  quizId: string;
  contextKind: AttemptContext;
  courseId: string | null;
  startedAt: string;
  submittedAt: string | null;
  scorePercent: number;
  pointsAwarded: number;
  pointsAvailable: number;
  passed: boolean;
  /**
   * `pendingReview` means this attempt has no verdict yet, so `passed` is false
   * for want of a decision and `scorePercent` is only the auto-graded floor.
   */
  status: AttemptStatus;
}

const quizKey = (quizId: string) => ["assessment-quiz", quizId];
const LIBRARY = ["assessment-library"];
const ATTEMPTS = ["assessment-attempts"];

/**
 * The learner's quiz library: published quizzes across every creator.
 *
 * Distinct from studio's `/learning/assessment/quizzes`, which lists only the
 * caller's *own* quizzes and includes their drafts — that endpoint can never
 * serve a library, and this one can never surface a draft.
 */
export const useDiscoverQuizzes = (options: {
  search?: string;
  page?: number;
  pageSize?: number;
}) =>
  useApi.query<QuizLibraryPage>(
    [...LIBRARY, options.search ?? "", String(options.page ?? 1)],
    "/learning/assessment/discover",
    {
      orgScoped: false,
      params: {
        search: options.search || undefined,
        page: options.page,
        pageSize: options.pageSize,
      },
    },
  );

export const useQuiz = (quizId: string) =>
  useApi.query<QuizTakeView>(quizKey(quizId), `/learning/assessment/quizzes/${quizId}`, {
    orgScoped: false,
    enabled: !!quizId,
    // Attempts-used is part of this payload, so it must not be served stale
    // after a submission.
    staleTime: 0,
  });

export const useSubmitQuiz = (quizId: string) =>
  useApi.mutation<SubmitQuizInput, AttemptResult>(`/learning/assessment/quizzes/${quizId}/submit`, {
    // The library carries attempts-used and best score per quiz, so it goes
    // stale the moment an attempt lands.
    invalidates: [
      quizKey(quizId),
      LIBRARY,
      ATTEMPTS,
      ["learning-progress"],
      ["learning-certificates"],
    ],
    // The result screen reports pass or fail itself; a toast would either
    // duplicate it or, worse, celebrate a failure.
    toast: { success: undefined },
  });

/** The learner's own attempt history, newest first, optionally for one quiz. */
export const useMyAttempts = (quizId?: string) =>
  useApi.query<{ attempts: QuizAttempt[] }>(
    [...ATTEMPTS, quizId ?? "all"],
    "/learning/assessment/attempts",
    { orgScoped: false, params: { quizId } },
  );
