"use client";

import { useEffect, useMemo, useState } from "react";
import { BookOpen, CheckCircle2, CircleDashed, EyeOff, Users } from "lucide-react";

import { useActiveOrg, usePermission } from "@datarango/auth";
import { Badge, Button, PageLayout, Skeleton, Statistics } from "@datarango/ui";

import { memberLabel, useOrgMembers, type OrgMember } from "@/hooks/orgs";
import {
  useDiscoverCourses,
  useOrgAssignments,
  useOrgCourseReport,
  type OrgMemberProgress,
} from "@/hooks/learning";

/** The buckets the server already counts, reused as the filter. */
type Bucket = "all" | "completed" | "inProgress" | "notStarted" | "notVisible";

export default function ProgressPage() {
  const { activeOrgId } = useActiveOrg();

  const canViewReports = usePermission("org.reports.view");
  const canViewMembers = usePermission("org.members.view");

  const [courseId, setCourseId] = useState<string | null>(null);
  const [bucket, setBucket] = useState<Bucket>("all");

  const { data: assignmentData, isLoading: assignmentsLoading } = useOrgAssignments(activeOrgId);
  const { data: courseList } = useDiscoverCourses({ pageSize: 100 });
  const { data: members } = useOrgMembers(canViewMembers ? activeOrgId : null);
  const {
    data: report,
    isLoading: reportLoading,
    error: reportError,
  } = useOrgCourseReport(canViewReports ? activeOrgId : null, courseId);

  const assignments = useMemo(() => assignmentData?.assignments ?? [], [assignmentData]);
  const courseTitles = useMemo(
    () => new Map((courseList?.courses ?? []).map((c) => [c.id, c.title] as const)),
    [courseList],
  );
  const byUserId = useMemo(
    () => new Map((members ?? []).map((m) => [m.userId, m] as const)),
    [members],
  );

  /**
   * Only courses this org has actually assigned. Driving the picker from the
   * catalogue instead would offer hundreds of courses whose report is
   * guaranteed empty, and hide the handful that matter.
   */
  const assignedCourses = useMemo(() => {
    const counts = new Map<string, number>();
    for (const a of assignments) counts.set(a.courseId, (counts.get(a.courseId) ?? 0) + 1);
    return [...counts.entries()]
      .map(([id, count]) => ({ id, count, title: courseTitles.get(id) ?? null }))
      .sort((a, b) => (a.title ?? a.id).localeCompare(b.title ?? b.id));
  }, [assignments, courseTitles]);

  // Land on the first course rather than an empty pane; re-pick if the current
  // selection disappears (last assignment withdrawn, org switched).
  useEffect(() => {
    if (assignedCourses.length === 0) {
      setCourseId(null);
      return;
    }
    if (!courseId || !assignedCourses.some((c) => c.id === courseId)) {
      setCourseId(assignedCourses[0]!.id);
    }
  }, [assignedCourses, courseId]);

  const rows = useMemo(() => {
    const all = report?.members ?? [];
    switch (bucket) {
      case "completed":
        return all.filter((m) => m.completed);
      case "inProgress":
        return all.filter((m) => m.progressVisible && !m.completed && m.lessonsCompleted > 0);
      case "notStarted":
        return all.filter((m) => m.progressVisible && !m.completed && m.lessonsCompleted === 0);
      case "notVisible":
        return all.filter((m) => !m.progressVisible);
      default:
        return all;
    }
  }, [report, bucket]);

  if (!canViewReports) {
    return (
      <PageLayout title="Progress" subtitle="How your members are doing on assigned courses.">
        <Notice title="You don't have access to progress reporting">
          Reading how members are doing needs the <Code>org.reports.view</Code> permission. It is
          deliberately separate from <Code>org.courses.assign</Code> — putting a course in front of
          people and reading everyone&apos;s progress are different powers. An owner or admin can
          grant it from Roles.
        </Notice>
      </PageLayout>
    );
  }

  return (
    <PageLayout
      title="Progress"
      subtitle="How your members are doing on the courses this organization assigned."
    >
      {assignmentsLoading ? (
        <Skeleton skeleton="table" rows={3} columns={2} />
      ) : assignedCourses.length === 0 ? (
        <Notice title="Nothing assigned yet">
          Progress is reported per assigned course. Assign a course to your members first and their
          standing will appear here.
        </Notice>
      ) : (
        <>
          <section className="space-y-2">
            <p className="caption-upper text-muted-foreground">Assigned courses</p>
            <div className="flex flex-wrap gap-2">
              {assignedCourses.map((course) => (
                <button
                  key={course.id}
                  type="button"
                  aria-pressed={course.id === courseId}
                  onClick={() => {
                    setCourseId(course.id);
                    setBucket("all");
                  }}
                  className={`border-hairline flex items-center gap-2 rounded-xs border px-3 py-2 text-sm transition-colors ${
                    course.id === courseId ? "bg-muted" : "hover:bg-muted/50"
                  }`}
                >
                  <BookOpen className="text-muted-foreground size-4 shrink-0" />
                  {course.title ?? (
                    <span className="text-muted-foreground font-mono text-xs">
                      {course.id.slice(0, 8)}…
                    </span>
                  )}
                  <span className="text-muted-foreground text-xs">{course.count}</span>
                </button>
              ))}
            </div>
          </section>

          {reportError ? (
            <Notice title="Couldn't load this report">{reportError.message}</Notice>
          ) : reportLoading || !report ? (
            <>
              <Skeleton skeleton="statistics" />
              <Skeleton skeleton="table" rows={5} columns={4} />
            </>
          ) : (
            <>
              {report.summary && (
                <section className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
                  <Statistics
                    label="Assigned"
                    value={String(report.summary.assigned)}
                    icon={Users}
                    description="members"
                  />
                  <Statistics
                    label="Completed"
                    value={String(report.summary.completed)}
                    icon={CheckCircle2}
                  />
                  <Statistics
                    label="In progress"
                    value={String(report.summary.inProgress)}
                    icon={CircleDashed}
                  />
                  {/*
                    Not started counts only members the report can actually see.
                    The not-visible ones get their own tile rather than a
                    footnote on this one — hanging them off "Not started" is
                    exactly the misreading the flag exists to prevent.
                  */}
                  <Statistics
                    label="Not started"
                    value={String(report.summary.notStarted)}
                    icon={CircleDashed}
                  />
                  {report.summary.progressNotVisible > 0 && (
                    <Statistics
                      label="Not visible"
                      value={String(report.summary.progressNotVisible)}
                      icon={EyeOff}
                      description="own enrolment"
                    />
                  )}
                </section>
              )}

              {report.summary && (
                <BucketFilter
                  summary={report.summary}
                  active={bucket}
                  onChange={setBucket}
                />
              )}

              <section className="border-hairline bg-card overflow-hidden rounded-xs border">
                <div className="border-hairline text-muted-foreground grid grid-cols-[1.5fr_2fr_auto] gap-4 border-b px-4 py-2 text-xs font-medium uppercase">
                  <span>Member</span>
                  <span>Progress</span>
                  <span className="text-right">Last activity</span>
                </div>
                {rows.length === 0 ? (
                  <p className="text-muted-foreground px-4 py-6 text-sm">
                    No members in this group.
                  </p>
                ) : (
                  rows.map((member) => (
                    <MemberProgressRow
                      key={member.userId}
                      progress={member}
                      member={byUserId.get(member.userId)}
                      canViewMembers={canViewMembers}
                    />
                  ))
                )}
              </section>

              {/*
                Stated where the number is, not in a footnote: a manager reading
                "0 of 12" for someone who has actually finished would chase the
                wrong person, and this is the one row where the report cannot
                answer the question it is being asked.
              */}
              {(report.summary?.progressNotVisible ?? 0) > 0 && (
                <p className="text-muted-foreground text-xs">
                  {report.summary!.progressNotVisible} member
                  {report.summary!.progressNotVisible === 1 ? " was" : "s were"} already enrolled
                  when you assigned this course, so that enrolment is personally theirs — the
                  organization can&apos;t read its progress. They may have finished; there is no way
                  to tell from here.
                </p>
              )}
            </>
          )}
        </>
      )}
    </PageLayout>
  );
}

const BucketFilter = ({
  summary,
  active,
  onChange,
}: {
  summary: { assigned: number; completed: number; inProgress: number; notStarted: number; progressNotVisible: number };
  active: Bucket;
  onChange: (next: Bucket) => void;
}) => {
  const options: { key: Bucket; label: string; count: number }[] = [
    { key: "all", label: "All", count: summary.assigned },
    { key: "completed", label: "Completed", count: summary.completed },
    { key: "inProgress", label: "In progress", count: summary.inProgress },
    { key: "notStarted", label: "Not started", count: summary.notStarted },
    { key: "notVisible", label: "Not visible", count: summary.progressNotVisible },
  ];

  return (
    <div className="flex flex-wrap gap-2">
      {options
        // A bucket with nobody in it is noise — except "All", which anchors the row.
        .filter((option) => option.key === "all" || option.count > 0)
        .map((option) => (
          <Button
            key={option.key}
            size="sm"
            variant={option.key === active ? "default" : "outline"}
            onClick={() => onChange(option.key)}
          >
            {option.label}
            <span className="ml-1.5 opacity-70">{option.count}</span>
          </Button>
        ))}
    </div>
  );
};

const MemberProgressRow = ({
  progress,
  member,
  canViewMembers,
}: {
  progress: OrgMemberProgress;
  member: OrgMember | undefined;
  canViewMembers: boolean;
}) => (
  <div className="border-hairline grid grid-cols-[1.5fr_2fr_auto] items-center gap-4 border-b px-4 py-3 text-sm last:border-0">
    <span className="min-w-0">
      {member ? (
        <>
          <span className="text-ink block truncate">{memberLabel(member)}</span>
          {member.displayName && member.email && (
            <span className="text-muted-foreground block truncate text-xs">{member.email}</span>
          )}
        </>
      ) : (
        // Assigned before they left, or a role that can't list members — say
        // which rather than rendering a bare uuid as if it were a name.
        <span className="text-muted-foreground font-mono text-xs">
          {progress.userId.slice(0, 8)}…{" "}
          <span className="font-sans">
            {canViewMembers ? "(not a current member)" : "(name needs org.members.view)"}
          </span>
        </span>
      )}
    </span>

    <span className="min-w-0">
      {!progress.progressVisible ? (
        <span className="text-muted-foreground inline-flex items-center gap-1.5 text-xs">
          <EyeOff className="size-3.5 shrink-0" />
          Their own enrolment — progress not visible to the organization
        </span>
      ) : (
        <>
          <span className="flex items-center justify-between text-xs">
            <span className="text-muted-foreground">
              {progress.lessonsCompleted} of {progress.lessonsTotal} lesson
              {progress.lessonsTotal === 1 ? "" : "s"}
              {progress.modulesTotal > 0 &&
                ` · ${progress.modulesCompleted}/${progress.modulesTotal} modules`}
            </span>
            <span className="text-muted-foreground">{progress.percentComplete}%</span>
          </span>
          <span
            role="progressbar"
            aria-valuenow={progress.percentComplete}
            aria-valuemin={0}
            aria-valuemax={100}
            aria-label={`${progress.percentComplete}% complete`}
            className="bg-muted mt-1.5 block h-2 rounded-full"
          >
            <span
              className={`block h-2 rounded-full transition-all ${
                progress.completed ? "bg-green-500" : "bg-primary-500"
              }`}
              style={{ width: `${progress.percentComplete}%` }}
            />
          </span>
        </>
      )}
    </span>

    <span className="text-muted-foreground text-right text-xs">
      {progress.completed ? (
        <Badge variant="success">
          Completed {progress.completedAt ? new Date(progress.completedAt).toLocaleDateString() : ""}
        </Badge>
      ) : !progress.progressVisible ? (
        <span>assigned {new Date(progress.assignedAt).toLocaleDateString()}</span>
      ) : progress.lastActivityAt ? (
        new Date(progress.lastActivityAt).toLocaleDateString()
      ) : (
        <Badge variant="outline">Not started</Badge>
      )}
    </span>
  </div>
);

const Notice = ({ title, children }: { title: string; children: React.ReactNode }) => (
  <div className="border-hairline bg-muted/40 rounded-xs border px-4 py-3 text-sm">
    <p className="text-ink font-medium">{title}</p>
    <p className="text-muted-foreground mt-1">{children}</p>
  </div>
);

const Code = ({ children }: { children: React.ReactNode }) => (
  <code className="bg-muted rounded-xs px-1 py-0.5 font-mono text-xs">{children}</code>
);
