"use client";

import { useApi } from "@datarango/api";

/**
 * The org manager's slice of learning: putting a course in front of members,
 * and reading back what the org has asked of whom.
 *
 * Two scoping rules pull in opposite directions here and both matter:
 *
 *  - **Assignments are org-scoped.** The row is the org's record, its RLS policy
 *    keys on `app.current_org`, and the gateway resolves the org from the path
 *    before the handler runs. These queries are therefore org-scoped (the
 *    default), so switching orgs must not serve another tenant's list from cache.
 *  - **The course catalogue is not.** Discovery reads published courses across
 *    every creator and never varies by org, so it passes `orgScoped: false` — the
 *    same call the learner-facing `web` app makes.
 */

export type CourseStatus = "draft" | "review" | "published" | "archived";

/** The catalogue row as discovery returns it. */
export interface Course {
  id: string;
  creatorId: string;
  orgId: string | null;
  slug: string;
  title: string;
  summary: string;
  status: CourseStatus;
  currentVersionId: string | null;
  createdAt: string;
  updatedAt: string;
}

export interface CourseList {
  courses: Course[];
  total: number;
}

/**
 * One assignment: this org asked this member to take this course.
 *
 * Note what is *not* here — any hint of how far they have got. Enrolment rows
 * are user-owned and enrollment's RLS never lets one user read another's, so a
 * manager writes a seat enrolment they cannot read back. Progress reporting
 * needs an explicitly-written reporting read on the learning side; it is not
 * something this endpoint can be coaxed into returning.
 */
export interface OrgAssignment {
  id: string;
  orgId: string;
  courseId: string;
  userId: string;
  assignedBy: string;
  assignedAt: string;
  /** Null if the assignment was recorded without activating the seat enrolment. */
  activatedAt: string | null;
}

/**
 * Assigning is idempotent per member and partial by design: putting a course in
 * front of twenty people must not fail because one of them already had it. The
 * two lists are reported separately so the UI can say "3 assigned, 2 already had
 * it" instead of claiming five.
 */
export interface AssignResult {
  assigned: string[];
  alreadyAssigned: string[];
}

const DISCOVER = ["console-discover"];
const assignmentsKey = (orgId: string) => ["org-assignments", orgId];

/** Published courses from every creator — what an org can actually assign. */
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

export const useOrgAssignments = (orgId: string | null, courseId?: string) =>
  useApi.query<{ assignments: OrgAssignment[] }>(
    [...assignmentsKey(orgId ?? ""), courseId ?? "all"],
    `/learning/enrollment/orgs/${orgId}/assignments`,
    { enabled: !!orgId, params: { courseId } },
  );

export const useAssignCourse = (orgId: string) =>
  useApi.mutation<{ courseId: string; userIds: string[] }, AssignResult>(
    `/learning/enrollment/orgs/${orgId}/assignments`,
    { invalidates: [assignmentsKey(orgId)] },
  );
