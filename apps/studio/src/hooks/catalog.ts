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
const courseTreeKey = (courseId: string) => ["catalog-course-tree", courseId];

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

export interface PublishResult {
  course: Course;
  version: CourseVersion;
}

/**
 * Publish refuses until every module has an exercise; the backend answers
 * catalog.publish_invariant. The default error toast carries that message, so
 * the caller only needs onError for anything richer.
 */
export const usePublishCourse = (courseId: string) =>
  useApi.mutation<void, PublishResult>(`/learning/catalog/courses/${courseId}/publish`, {
    invalidates: [COURSES, courseTreeKey(courseId)],
    toast: { success: "Course published" },
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
