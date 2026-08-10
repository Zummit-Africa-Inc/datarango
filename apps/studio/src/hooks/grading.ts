"use client";

import { useApi } from "@datarango/api";

/**
 * Manual grading, creator side.
 *
 * These hit the **personal** grading routes (`/learning/assessment/grading/*`),
 * which the server reads as "a creator grading their own quizzes". The org
 * routes under `/orgs/{orgId}/grading/*` are the instructor's equivalent and
 * live in console — the difference is not cosmetic, it selects which attempts
 * the server will widen the transaction to, so the two are separate paths
 * rather than one path with a flag.
 *
 * `orgScoped: false` throughout: what a creator may grade follows quiz
 * ownership, not whichever org they happen to be looking at.
 */

export type QuestionKind = "mcq" | "multiSelect" | "shortAnswer" | "codeSnippet";

export interface GradingQueueItem {
  attemptId: string;
  quizId: string;
  quizTitle: string;
  /** Names live in accounts; the grading module only knows ids. */
  userId: string;
  courseId: string | null;
  submittedAt: string;
  answersAwaitingReview: number;
  pointsAwaitingReview: number;
}

export interface GradingQueuePage {
  items: GradingQueueItem[];
  total: number;
}

/**
 * One answer as the grader sees it.
 *
 * There is deliberately nowhere to put an answer key. The server projects this
 * shape rather than serialising the question, because an org instructor may be
 * marking a quiz written by a creator they have nothing to do with — handing
 * over the key would let anyone with `org.grading.grade` collect keys for
 * published quizzes.
 */
export interface GradingAnswer {
  answerId: string;
  questionId: string;
  position: number;
  kind: QuestionKind;
  prompt: string;
  /** The learner's response: option ids, or a single-element array of text. */
  response: string[];
  pointsAvailable: number;
  needsManualGrading: boolean;
  graded: boolean;
  pointsAwarded: number;
  feedback: string | null;
}

export interface GradingAttempt {
  attemptId: string;
  quizId: string;
  quizTitle: string;
  userId: string;
  courseId: string | null;
  submittedAt: string;
  passThresholdPercent: number;
  /** The floor from the auto-graded half — it can only rise as grades land. */
  scorePercent: number;
  pointsAwarded: number;
  pointsAvailable: number;
  answers: GradingAnswer[];
}

export interface GradeAnswerResult {
  attemptId: string;
  answersStillAwaitingReview: number;
  finalised: boolean;
  passed: boolean;
  scorePercent: number;
  /**
   * *Queued*, not applied. The grader's transaction cannot write the learner's
   * own progress rows, so a course-bound pass is applied by a consumer moments
   * later — a grading UI should say the mark is recorded, not that the
   * learner's module is complete.
   */
  courseProgressQueued: boolean;
}

export interface GradeAnswerInput {
  answerId: string;
  pointsAwarded: number;
  feedback?: string;
}

const QUEUE = ["grading-queue"];
const attemptKey = (attemptId: string) => ["grading-attempt", attemptId];

export const useGradingQueue = (options: { page?: number; pageSize?: number } = {}) =>
  useApi.query<GradingQueuePage>(
    [...QUEUE, String(options.page ?? 1)],
    "/learning/assessment/grading/queue",
    {
      orgScoped: false,
      params: { page: options.page, pageSize: options.pageSize },
      // A queue people are waiting in should not be served from cache after a
      // grade lands elsewhere.
      staleTime: 0,
    },
  );

export const useGradingAttempt = (attemptId: string) =>
  useApi.query<GradingAttempt>(
    attemptKey(attemptId),
    `/learning/assessment/grading/attempts/${attemptId}`,
    { orgScoped: false, enabled: !!attemptId },
  );

export const useGradeAnswer = (attemptId: string) =>
  useApi.mutation<GradeAnswerInput, GradeAnswerResult>(
    (v) => `/learning/assessment/grading/answers/${v.answerId}`,
    {
      // Both: the attempt's remaining count changes, and finalising removes it
      // from the queue entirely.
      invalidates: [attemptKey(attemptId), QUEUE],
    },
  );
