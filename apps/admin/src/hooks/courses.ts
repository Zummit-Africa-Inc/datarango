"use client";

import { useApi } from "@datarango/api";

/**
 * Courses across the platform, for staff. Every course can be read with
 * learning:courses:view; only Datarango's own (owner "platform") can be
 * created or changed, with learning:courses:manage. Learning enforces that
 * last part, not just this app.
 */

export type CourseStatus = "draft" | "review" | "published" | "archived";
export type CourseOwner = "platform" | "organisation" | "creator";

export const COURSE_STATUS_LABEL: Record<CourseStatus, string> = {
  draft: "Draft",
  review: "In review",
  published: "Published",
  archived: "Archived",
};

export const COURSE_OWNER_LABEL: Record<CourseOwner, string> = {
  platform: "Datarango",
  organisation: "Organisation",
  creator: "Creator",
};

export interface StaffCourse {
  id: string;
  title: string;
  slug: string;
  summary: string;
  imageUrl: string | null;
  status: CourseStatus;
  owner: CourseOwner;
  orgId: string | null;
  /** Null for Datarango's own courses. */
  creatorId: string | null;
  createdAt: string;
  updatedAt: string;
  publishedAt: string | null;
}

export interface StaffCoursePage {
  items: StaffCourse[];
  total: number;
  page: number;
  pageSize: number;
}

export interface StaffCourseDetail {
  course: StaffCourse;
  overview: string | null;
  learningOutcomes: string[];
  prerequisites: string[];
  targetAudience: string | null;
  modules: {
    id: string;
    position: number;
    title: string;
    summary: string;
    lessons: { id: string; position: number; title: string }[];
  }[];
}

export interface CourseInput {
  title: string;
  summary: string;
  imageUrl: string | null;
  overview: string | null;
  learningOutcomes: string[];
  prerequisites: string[];
  targetAudience: string | null;
}

const COURSES = ["staff-courses"];

export const useStaffCourses = (filters: {
  query?: string;
  status?: CourseStatus | "";
  owner?: CourseOwner | "";
  orgId?: string;
  page?: number;
  pageSize?: number;
}) =>
  useApi.query<StaffCoursePage>(
    [
      ...COURSES,
      filters.query ?? "",
      filters.status ?? "",
      filters.owner ?? "",
      filters.orgId ?? "",
      String(filters.page ?? 1),
    ],
    "/staff/courses",
    {
      orgScoped: false,
      params: {
        q: filters.query || undefined,
        status: filters.status || undefined,
        owner: filters.owner || undefined,
        orgId: filters.orgId || undefined,
        page: filters.page,
        pageSize: filters.pageSize ?? 25,
      },
    },
  );

export const useStaffCourse = (courseId: string) =>
  useApi.query<StaffCourseDetail>([...COURSES, "one", courseId], `/staff/courses/${courseId}`, {
    orgScoped: false,
  });

export const useCreateCourse = () =>
  useApi.mutation<CourseInput, { course: StaffCourse }>("/staff/courses", {
    method: "POST",
    invalidates: [COURSES],
    toast: { success: "Course created" },
  });

export const useUpdateCourse = () =>
  useApi.mutation<CourseInput & { courseId: string }, { course: StaffCourse }>(
    (v) => `/staff/courses/${v.courseId}`,
    { method: "PUT", invalidates: [COURSES], toast: { success: "Course saved" } },
  );

export const useSubmitCourse = () =>
  useApi.mutation<{ courseId: string }, unknown>((v) => `/staff/courses/${v.courseId}/submit`, {
    method: "POST",
    invalidates: [COURSES],
    toast: { success: "Sent for review" },
  });

/** One item per non-empty line. */
export const lines = (text: string) =>
  text
    .split("\n")
    .map((l) => l.trim())
    .filter(Boolean);
