"use client";

import { useApi } from "@datarango/api";

/**
 * Manual grading, org-instructor side.
 *
 * These hit the **org** grading routes (`/learning/assessment/orgs/{orgId}/grading/*`).
 * Studio's creator equivalent uses the personal routes, and the split is not
 * cosmetic: the org id in the path is what the gateway resolves into the
 * envelope, and what the server then uses to decide which attempts to widen the
 * transaction to. One path with a flag would put that decision in a body.
 *
 * Scoped through **assignments**, not membership: an instructor sees submissions
 * from members on courses this org actually assigned. A member's personal study
 * is invisible here, exactly as it is on the progress report.
 *
 * Queries are org-scoped, so the cache never serves one org's queue to another.
 */

export type QuestionKind = "mcq" | "multiSelect" | "shortAnswer" | "codeSnippet";

export interface GradingQueueItem {
  attemptId: string;
  quizId: string;
  quizTitle: string;
  /** Resolve against useOrgMembers for a name; the grading module only has ids. */
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
 * One answer as the grader sees it — with no answer key, deliberately. The quiz
 * may belong to a creator this org has nothing to do with, so shipping the key
 * would let anyone holding `org.grading.grade` collect keys for published
 * quizzes.
 */
export interface GradingAnswer {
  answerId: string;
  questionId: string;
  position: number;
  kind: QuestionKind;
  prompt: string;
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
  /** The auto-graded floor — it can only rise as marks land. */
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
  /** Queued, not applied — a consumer writes the learner's progress moments later. */
  courseProgressQueued: boolean;
}

export interface GradeAnswerInput {
  answerId: string;
  pointsAwarded: number;
  feedback?: string;
}

const QUEUE = ["org-grading-queue"];
const attemptKey = (attemptId: string) => ["org-grading-attempt", attemptId];

export const useOrgGradingQueue = (
  orgId: string | null,
  options: { page?: number; pageSize?: number } = {},
) =>
  useApi.query<GradingQueuePage>(
    [...QUEUE, String(options.page ?? 1)],
    `/learning/assessment/orgs/${orgId}/grading/queue`,
    {
      enabled: !!orgId,
      params: { page: options.page, pageSize: options.pageSize },
      // People are waiting in this queue; a cached copy after a colleague marks
      // something is worse than a refetch.
      staleTime: 0,
    },
  );

export const useOrgGradingAttempt = (orgId: string | null, attemptId: string) =>
  useApi.query<GradingAttempt>(
    attemptKey(attemptId),
    `/learning/assessment/orgs/${orgId}/grading/attempts/${attemptId}`,
    { enabled: !!orgId && !!attemptId },
  );

export const useOrgGradeAnswer = (orgId: string | null, attemptId: string) =>
  useApi.mutation<GradeAnswerInput, GradeAnswerResult>(
    (v) => `/learning/assessment/orgs/${orgId}/grading/answers/${v.answerId}`,
    { invalidates: [attemptKey(attemptId), QUEUE] },
  );
