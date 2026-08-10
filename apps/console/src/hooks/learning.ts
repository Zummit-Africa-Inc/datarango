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
 * manager writes a seat enrolment they cannot read back. Progress comes from a
 * separate, deliberately-written reporting read (`useOrgCourseReport` below)
 * behind its own permission; it is not something this endpoint can be coaxed
 * into returning.
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

/**
 * One member's standing on an assigned course (mirrors learning's
 * `OrgMemberProgress`).
 *
 * `progressVisible` is **not** a permission flag — the manager is authorised for
 * every field in this record. It marks a member who was already enrolled when
 * the org assigned the course, so their enrolment is personally theirs and the
 * org's reporting policy does not admit it. The honest answer there is "we
 * can't see this", never a zero: rendering 0% would tell a manager the person
 * hasn't started when they may well have finished.
 */
export interface OrgMemberProgress {
  userId: string;
  assignedAt: string;
  progressVisible: boolean;
  lessonsCompleted: number;
  lessonsTotal: number;
  modulesCompleted: number;
  modulesTotal: number;
  percentComplete: number;
  completed: boolean;
  completedAt: string | null;
  lastActivityAt: string | null;
  startedAt: string | null;
}

/**
 * Counts across the report. `progressNotVisible` is its own bucket rather than
 * folded into `notStarted`, for the same reason the flag exists at all.
 */
export interface OrgCourseSummary {
  assigned: number;
  completed: number;
  inProgress: number;
  notStarted: number;
  progressNotVisible: number;
}

/** `summary` is null when nothing is assigned — no report to summarise. */
export interface OrgCourseReport {
  orgId: string;
  courseId: string;
  members: OrgMemberProgress[];
  summary: OrgCourseSummary | null;
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

/**
 * Per-member progress on one assigned course.
 *
 * Gated server-side on `org.reports.view`, separately from `org.courses.assign`
 * — putting training in front of people and reading how everyone is doing are
 * different powers, and org roles are custom, so the UI checks the same
 * permission before it renders rather than letting the call 403.
 */
export const useOrgCourseReport = (orgId: string | null, courseId: string | null) =>
  useApi.query<OrgCourseReport>(
    ["org-course-report", orgId ?? "", courseId ?? ""],
    `/learning/enrollment/orgs/${orgId}/reports/courses/${courseId}`,
    { enabled: !!orgId && !!courseId },
  );
