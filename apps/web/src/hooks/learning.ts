"use client";

import { useApi } from "@datarango/api";

/**
 * Learner-facing learning API.
 *
 * Everything here is user-scoped rather than org-scoped — a personal enrolment
 * belongs to the learner even when an org granted it — so queries pass
 * `orgScoped: false`. Leaving the default on would fragment the cache by
 * whichever org context the learner last looked at, for data that never varies
 * by org.
 *
 * Enums cross the wire as camelCase names, not ordinals.
 */

export type CourseStatus = "draft" | "review" | "published" | "archived";
export type LessonKind = "video" | "text" | "audio" | "quiz";
export type EnrollmentSource = "free" | "subscription" | "seat" | "payAsYouGo" | "token";

export interface Course {
  id: string;
  creatorId: string;
  slug: string;
  title: string;
  summary: string;
  status: CourseStatus;
  currentVersionId: string | null;
  updatedAt: string;
}

export interface CourseList {
  courses: Course[];
  total: number;
}

export interface Lesson {
  id: string;
  moduleId: string;
  position: number;
  kind: LessonKind;
  title: string;
  body: string;
  muxPlaybackId: string | null;
}

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
  version: { id: string; moduleCount: number } | null;
  modules: CourseTreeModule[];
}

export interface Enrollment {
  id: string;
  courseId: string;
  courseVersionId: string;
  source: EnrollmentSource;
  grantedByOrgId: string | null;
  completedAt: string | null;
  createdAt: string;
}

export interface ModuleProgress {
  moduleId: string;
  position: number;
  lessonsTotal: number;
  lessonsCompleted: number;
  exercisePassed: boolean;
  completed: boolean;
}

export interface ProgressSnapshot {
  enrollmentId: string;
  courseId: string;
  courseVersionId: string;
  modules: ModuleProgress[];
  completed: boolean;
  completedAt: string | null;
  percentComplete: number;
}

export interface Certificate {
  id: string;
  courseId: string;
  serial: string;
  courseTitle: string;
  issuedAt: string;
  pdfUrl: string | null;
}

const DISCOVER = ["learning-discover"];
const ENROLLMENTS = ["learning-enrollments"];
const CERTIFICATES = ["learning-certificates"];
const treeKey = (courseId: string) => ["learning-course-tree", courseId];
const progressKey = (courseId: string) => ["learning-progress", courseId];

// ── Discovery ──────────────────────────────────────────────────────────────

/** Published courses from every creator — not the caller's own authoring list. */
export const useDiscoverCourses = (options: {
  search?: string;
  page?: number;
  pageSize?: number;
}) =>
  useApi.query<CourseList>(
    [...DISCOVER, options.search ?? "", String(options.page ?? 1)],
    "/learning/catalog/discover",
    {
      orgScoped: false,
      params: {
        search: options.search || undefined,
        page: options.page,
        pageSize: options.pageSize,
      },
    },
  );

/** Course syllabus. Readable for any published course, enrolled or not. */
export const useCourseTree = (courseId: string) =>
  useApi.query<CourseTree>(treeKey(courseId), `/learning/catalog/courses/${courseId}/tree`, {
    orgScoped: false,
    enabled: !!courseId,
  });

// ── Enrolment & progress ───────────────────────────────────────────────────

export const useMyEnrollments = () =>
  useApi.query<{ enrollments: Enrollment[] }>(ENROLLMENTS, "/learning/enrollment/", {
    orgScoped: false,
  });

export const useEnroll = (courseId: string) =>
  useApi.mutation<void, Enrollment>(`/learning/enrollment/courses/${courseId}`, {
    invalidates: [ENROLLMENTS, progressKey(courseId)],
    toast: { success: "You're enrolled" },
  });

/**
 * Progress for a course the learner is enrolled in. Disabled when not enrolled —
 * the endpoint answers `enrollment.not_found`, which is correct but not worth
 * surfacing as an error toast on a course page somebody is merely browsing.
 */
export const useCourseProgress = (courseId: string, enrolled: boolean) =>
  useApi.query<ProgressSnapshot>(
    progressKey(courseId),
    `/learning/enrollment/courses/${courseId}/progress`,
    { orgScoped: false, enabled: !!courseId && enrolled },
  );

export const useCompleteLesson = (courseId: string) =>
  useApi.mutation<{ lessonId: string }, ProgressSnapshot>(
    (v) => `/learning/enrollment/courses/${courseId}/lessons/${v.lessonId}/complete`,
    { invalidates: [progressKey(courseId), ENROLLMENTS, CERTIFICATES] },
  );

// ── Certificates ───────────────────────────────────────────────────────────

export const useMyCertificates = () =>
  useApi.query<{ certificates: Certificate[] }>(CERTIFICATES, "/learning/enrollment/certificates", {
    orgScoped: false,
  });
