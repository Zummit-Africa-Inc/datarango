"use client";

import { useApi } from "@datarango/api";

/**
 * Catalog types mirror the wire shapes served by the gateway's
 * /learning/catalog/* routes (dr.learning.rpc.catalog.* over NATS).
 *
 * Enums arrive as camelCase names, not ordinals — the catalog serializer
 * registers JsonStringEnumConverter precisely so a renumbered C# enum can't
 * silently change meaning here.
 *
 * Catalog data is creator-scoped, not org-scoped: the gateway resolves these
 * calls with a null org. Every query below therefore passes orgScoped: false,
 * or an org switch would fragment the cache for data that never varies by org.
 */

export type CourseStatus = "draft" | "review" | "published" | "archived";
export type LessonKind = "video" | "text" | "audio" | "quiz";

export interface Price {
  currency: string;
  amountMinor: number;
}

export interface Course {
  id: string;
  creatorId: string;
  orgId: string | null;
  slug: string;
  title: string;
  summary: string;
  status: CourseStatus;
  pricesJson: string;
  creatorRevenueShareBps: number;
  currentVersionId: string | null;
  createdAt: string;
  updatedAt: string;
}

export interface CourseVersion {
  id: string;
  courseId: string;
  title: string;
  summary: string;
  publishedAt: string | null;
  publishedBy: string | null;
  moduleCount: number;
}

export interface Lesson {
  id: string;
  moduleId: string;
  position: number;
  kind: LessonKind;
  title: string;
  body: string;
  muxPlaybackId: string | null;
  muxAssetId: string | null;
}

/** A module flattened with its lessons, as returned by get_course_tree. */
export interface CourseTreeModule {
  id: string;
  position: number;
  title: string;
  summary: string;
  exerciseId: string | null;
  lessons: Lesson[];
}

export interface CourseTree {
  course: Course;
  /** Null until the first module is added (no draft version exists yet). */
  version: CourseVersion | null;
  modules: CourseTreeModule[];
}

export interface CourseList {
  courses: Course[];
  /** Unpaged total, for the pager. */
  total: number;
}

const COURSES = ["catalog-courses"];

/** The creator's review-status view, invalidated by submit and withdraw. */
export const REVIEW = ["catalog-review-status"];

/**
 * Exported because media uploads land outside this module: a lesson's playback
 * id is written by learning's consumer of `dr.media.asset.ready`, so the studio
 * has to be able to re-read the tree after an upload without owning that write.
 */
export const courseTreeKey = (courseId: string) => ["catalog-course-tree", courseId];

// ── Courses ────────────────────────────────────────────────────────────────

export const useMyCourses = (options: {
  status?: CourseStatus;
  page?: number;
  pageSize?: number;
}) =>
  useApi.query<CourseList>(
    [...COURSES, options.status ?? "all", String(options.page ?? 1)],
    "/learning/catalog/courses",
    {
      orgScoped: false,
      params: {
        status: options.status,
        page: options.page,
        pageSize: options.pageSize,
      },
    },
  );

export const useCourseTree = (courseId: string) =>
  useApi.query<CourseTree>(courseTreeKey(courseId), `/learning/catalog/courses/${courseId}/tree`, {
    orgScoped: false,
    enabled: !!courseId,
  });

export interface CreateCourseInput {
  slug: string;
  title: string;
  summary: string;
  prices: Price[];
  creatorRevenueShareBps: number;
}

export const useCreateCourse = () =>
  useApi.mutation<CreateCourseInput, Course>("/learning/catalog/courses", {
    invalidates: [COURSES],
    toast: { success: "Course created" },
  });

export const useUpdateCourse = (courseId: string) =>
  useApi.mutation<{ title?: string; summary?: string }, Course>(
    `/learning/catalog/courses/${courseId}`,
    {
      method: "PATCH",
      invalidates: [COURSES, courseTreeKey(courseId)],
      toast: { success: "Course updated" },
    },
  );

/**
 * Hands the draft to the platform for review.
 *
 * This is as far as a creator can take their own course. **There is no publish
 * endpoint** — the direct path was removed on 2026-08-11 because
 * `publish_course_version` performed no status check, so a draft could reach
 * learners without anyone reviewing it. A course becomes published by a
 * reviewer approving it, and approval *is* publication.
 *
 * Refuses until every module has an exercise (`catalog.publish_invariant`) and
 * until the course has at least one module (`catalog.no_modules`) — checked here
 * as well as at approval, so a course that can never be published does not sit
 * in a queue wasting a reviewer's time on a problem only the creator can fix.
 * The default error toast carries the server's message.
 */
export const useSubmitForReview = (courseId: string) =>
  useApi.mutation<void, Course>(`/learning/catalog/courses/${courseId}/submit`, {
    invalidates: [COURSES, courseTreeKey(courseId), REVIEW],
    toast: { success: "Submitted for review" },
  });

/**
 * Takes it back out of the queue.
 *
 * The creator changing their mind — distinct from a reviewer rejecting, which
 * carries a reason and a different audit trail.
 */
export const useWithdrawFromReview = (courseId: string) =>
  useApi.mutation<void, Course>(`/learning/catalog/courses/${courseId}/withdraw`, {
    invalidates: [COURSES, courseTreeKey(courseId), REVIEW],
    toast: { success: "Withdrawn — back to draft" },
  });

// ── Modules ────────────────────────────────────────────────────────────────

export const useAddModule = (courseId: string) =>
  useApi.mutation<{ title: string; summary: string; position: number }, CourseTreeModule>(
    `/learning/catalog/courses/${courseId}/modules`,
    { invalidates: [courseTreeKey(courseId)], toast: { success: "Module added" } },
  );

export const useUpdateModule = (courseId: string) =>
  useApi.mutation<
    { moduleId: string; title?: string; summary?: string; exerciseId?: string },
    CourseTreeModule
  >((v) => `/learning/catalog/modules/${v.moduleId}`, {
    method: "PATCH",
    invalidates: [courseTreeKey(courseId)],
  });

export const useRemoveModule = (courseId: string) =>
  useApi.mutation<{ moduleId: string }, { lessonsRemoved: number }>(
    (v) => `/learning/catalog/modules/${v.moduleId}`,
    {
      method: "DELETE",
      invalidates: [courseTreeKey(courseId)],
      toast: { success: "Module removed" },
    },
  );

/** The id list must be a full permutation — the backend rejects partial lists. */
export const useReorderModules = (courseId: string) =>
  useApi.mutation<{ moduleIdsInOrder: string[] }, { reordered: number }>(
    `/learning/catalog/courses/${courseId}/modules/reorder`,
    { invalidates: [courseTreeKey(courseId)] },
  );

// ── Lessons ────────────────────────────────────────────────────────────────

export const useAddLesson = (courseId: string) =>
  useApi.mutation<
    { moduleId: string; kind: LessonKind; title: string; body: string; position: number },
    Lesson
  >((v) => `/learning/catalog/modules/${v.moduleId}/lessons`, {
    invalidates: [courseTreeKey(courseId)],
    toast: { success: "Lesson added" },
  });

export const useUpdateLesson = (courseId: string) =>
  useApi.mutation<{ lessonId: string; title?: string; body?: string; kind?: LessonKind }, Lesson>(
    (v) => `/learning/catalog/lessons/${v.lessonId}`,
    { method: "PATCH", invalidates: [courseTreeKey(courseId)] },
  );

export const useRemoveLesson = (courseId: string) =>
  useApi.mutation<{ lessonId: string }, { removed: boolean }>(
    (v) => `/learning/catalog/lessons/${v.lessonId}`,
    {
      method: "DELETE",
      invalidates: [courseTreeKey(courseId)],
      toast: { success: "Lesson removed" },
    },
  );

export const useReorderLessons = (courseId: string) =>
  useApi.mutation<{ moduleId: string; lessonIdsInOrder: string[] }, { reordered: number }>(
    (v) => `/learning/catalog/modules/${v.moduleId}/lessons/reorder`,
    { invalidates: [courseTreeKey(courseId)] },
  );
