"use client";

import { useApi } from "@datarango/api";

/**
 * The platform review surface (`/learning/review/*`).
 *
 * Every call here requires a **platform** role on the envelope, not an org
 * permission — a reviewer acts for Datarango, not for a tenant. So all of it is
 * `orgScoped: false`: there is no org context in this app, and keying the cache
 * by one would be inventing a tenant for data that has none.
 *
 * The server refuses each of these independently with `catalog.review_forbidden`
 * and the RLS policy behind them admits nothing without the declaration the
 * endpoint makes only after checking authority. The staff gate in the shell is
 * there so an ordinary user gets an explanation instead of a wall of 403s.
 */

export interface ReviewQueueItem {
  courseId: string;
  creatorId: string;
  slug: string;
  title: string;
  summary: string;
  moduleCount: number;
  submittedAt: string;
}

export type LessonKind = "video" | "text" | "audio" | "quiz";

export interface ReviewLesson {
  id: string;
  moduleId: string;
  position: number;
  kind: LessonKind;
  title: string;
  body: string;
  muxPlaybackId: string | null;
}

export interface ReviewModule {
  id: string;
  position: number;
  title: string;
  summary: string;
  exerciseId: string | null;
  lessons: ReviewLesson[];
}

export interface ReviewCourseTree {
  course: {
    id: string;
    slug: string;
    title: string;
    summary: string;
    status: string;
    creatorId: string;
  };
  version: { id: string; moduleCount: number } | null;
  modules: ReviewModule[];
}

const QUEUE = ["review-queue"];
const treeKey = (courseId: string) => ["review-course-tree", courseId];

/**
 * Everything awaiting a decision, oldest first.
 *
 * Arrival order, not newest-first: this is a queue people are waiting in, and
 * the fair order is the one the grading queue already uses.
 */
export const useReviewQueue = (options: { page?: number; pageSize?: number } = {}) =>
  useApi.query<ReviewQueueItem[]>([...QUEUE, String(options.page ?? 1)], "/learning/review/queue", {
    orgScoped: false,
    params: { page: options.page, pageSize: options.pageSize },
  });

/**
 * The submitted course in full.
 *
 * Reviewing without reading is rubber-stamping, and the ordinary catalog tree
 * read is creator-scoped — it would show a reviewer nothing. This is the
 * reviewer's own read, admitted by the review policy to submitted work only.
 */
export const useReviewCourseTree = (courseId: string | null) =>
  useApi.query<ReviewCourseTree>(
    treeKey(courseId ?? ""),
    `/learning/review/courses/${courseId}/tree`,
    { orgScoped: false, enabled: !!courseId },
  );

/** Approving *is* publishing — there is no separate publish step. */
export const useApproveCourse = () =>
  useApi.mutation<{ courseId: string }, { approved: boolean; courseId: string }>(
    (v) => `/learning/review/courses/${v.courseId}/approve`,
    { invalidates: [QUEUE], toast: { success: "Approved and published" } },
  );

/**
 * Sends it back with a reason.
 *
 * The reason is required by the server (`catalog.reason_required`) and rides on
 * the rejection event, so it reaches the creator's inbox verbatim. A rejection
 * without one tells them only that somebody said no.
 */
export const useRejectCourse = () =>
  useApi.mutation<{ courseId: string; reason: string }, { rejected: boolean; courseId: string }>(
    (v) => `/learning/review/courses/${v.courseId}/reject`,
    { invalidates: [QUEUE], toast: { success: "Sent back to the creator" } },
  );
