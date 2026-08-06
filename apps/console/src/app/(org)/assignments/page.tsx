"use client";

import { useMemo, useState } from "react";
import { BookOpen, Search } from "lucide-react";

import { useActiveOrg, usePermission } from "@datarango/auth";
import { Badge, Button, Checkbox, Input, Label, PageLayout, Skeleton } from "@datarango/ui";

import { memberLabel, useOrgMembers, type OrgMember } from "@/hooks/orgs";
import {
  useAssignCourse,
  useDiscoverCourses,
  useOrgAssignments,
  type AssignResult,
  type Course,
} from "@/hooks/learning";

export default function AssignmentsPage() {
  const { activeOrgId } = useActiveOrg();
  const orgId = activeOrgId ?? "";

  const canAssign = usePermission("org.courses.assign");
  const canViewMembers = usePermission("org.members.view");

  const [search, setSearch] = useState("");
  const [courseId, setCourseId] = useState<string | null>(null);
  const [selected, setSelected] = useState<Set<string>>(new Set());
  const [result, setResult] = useState<AssignResult | null>(null);

  const { data: courseList, isLoading: coursesLoading } = useDiscoverCourses({
    search,
    pageSize: 50,
  });
  const { data: members, isLoading: membersLoading } = useOrgMembers(activeOrgId);
  const { data: assignmentData, isLoading: assignmentsLoading } = useOrgAssignments(activeOrgId);
  const assign = useAssignCourse(orgId);

  const courses = useMemo(() => courseList?.courses ?? [], [courseList]);
  const assignments = useMemo(() => assignmentData?.assignments ?? [], [assignmentData]);

  // Only active members can take a seat — assigning to someone who has been
  // removed would create an enrolment the org can neither see nor withdraw.
  const activeMembers = useMemo(() => (members ?? []).filter((m) => m.active), [members]);

  const byUserId = useMemo(
    () => new Map((members ?? []).map((m) => [m.userId, m] as const)),
    [members],
  );
  const courseById = useMemo(() => new Map(courses.map((c) => [c.id, c] as const)), [courses]);

  /** Who already has this course, so the picker can say so before you send it. */
  const alreadyOnCourse = useMemo(() => {
    if (!courseId) return new Set<string>();
    return new Set(assignments.filter((a) => a.courseId === courseId).map((a) => a.userId));
  }, [assignments, courseId]);

  const toggle = (userId: string) =>
    setSelected((current) => {
      const next = new Set(current);
      if (next.has(userId)) next.delete(userId);
      else next.add(userId);
      return next;
    });

  const submit = () => {
    if (!courseId || selected.size === 0) return;
    assign.mutate(
      { courseId, userIds: [...selected] },
      {
        onSuccess: (data) => {
          setResult(data);
          setSelected(new Set());
        },
      },
    );
  };

  if (!canAssign && !canViewMembers) {
    return (
      <PageLayout
        title="Assignments"
        subtitle="Courses this organization has asked members to take."
      >
        <Notice title="You don't have access to assignments">
          Assigning courses needs the <Code>org.courses.assign</Code> permission, and seeing who has
          been assigned needs <Code>org.members.view</Code>. An owner or admin can grant either from
          Roles.
        </Notice>
      </PageLayout>
    );
  }

  return (
    <PageLayout
      title="Assignments"
      subtitle="Put a course in front of your members. Seated members already have access — assigning points them at it."
    >
      {canAssign && (
        <section className="border-hairline bg-card space-y-4 rounded-xs border p-4">
          <div className="space-y-1.5">
            <Label htmlFor="course-search">1 · Choose a course</Label>
            <div className="relative">
              <Search className="text-muted-foreground pointer-events-none absolute top-1/2 left-2.5 size-4 -translate-y-1/2" />
              <Input
                id="course-search"
                className="pl-8"
                placeholder="Search published courses…"
                value={search}
                onChange={(e) => setSearch(e.target.value)}
              />
            </div>
            <p className="text-muted-foreground text-xs">
              Only published courses appear. A draft is invisible to learners, so it cannot be
              assigned.
            </p>
          </div>

          {coursesLoading ? (
            <Skeleton skeleton="table" rows={3} columns={2} />
          ) : courses.length === 0 ? (
            <Notice title="No published courses match">
              {search
                ? "Try a different search."
                : "Nothing has been published to the catalogue yet. Courses are authored in Studio."}
            </Notice>
          ) : (
            <div className="max-h-64 space-y-1 overflow-y-auto">
              {courses.map((course) => (
                <CourseRow
                  key={course.id}
                  course={course}
                  selected={course.id === courseId}
                  onSelect={() => {
                    setCourseId(course.id);
                    setSelected(new Set());
                    setResult(null);
                  }}
                />
              ))}
            </div>
          )}

          <div className="space-y-1.5">
            <Label>2 · Choose members</Label>
            {!canViewMembers ? (
              <Notice title="You can assign, but not list members">
                Picking people needs <Code>org.members.view</Code>. Ask an owner or admin to add it
                to your role.
              </Notice>
            ) : membersLoading ? (
              <Skeleton skeleton="table" rows={4} columns={2} />
            ) : activeMembers.length === 0 ? (
              <Notice title="No active members">Invite people from the Members page first.</Notice>
            ) : (
              <>
                <div className="border-hairline max-h-64 overflow-y-auto rounded-xs border">
                  {activeMembers.map((member) => (
                    <MemberRow
                      key={member.userId}
                      member={member}
                      checked={selected.has(member.userId)}
                      already={alreadyOnCourse.has(member.userId)}
                      disabled={!courseId}
                      onToggle={() => toggle(member.userId)}
                    />
                  ))}
                </div>
                <SelectAll
                  members={activeMembers}
                  selected={selected}
                  disabled={!courseId}
                  onChange={setSelected}
                />
              </>
            )}
          </div>

          <div className="flex flex-wrap items-center gap-3">
            <Button
              disabled={!courseId || selected.size === 0 || assign.isPending}
              onClick={submit}
            >
              {assign.isPending
                ? "Assigning…"
                : `Assign${selected.size > 0 ? ` to ${selected.size}` : ""}`}
            </Button>
            {!courseId && (
              <p className="text-muted-foreground text-sm">Pick a course to choose members.</p>
            )}
          </div>

          {result && <AssignSummary result={result} byUserId={byUserId} />}
        </section>
      )}

      <section className="space-y-2">
        <h2 className="font-heading text-ink text-sm font-medium">
          Assigned{" "}
          <span className="text-muted-foreground font-normal">{assignments.length} total</span>
        </h2>

        {assignmentsLoading ? (
          <Skeleton skeleton="table" rows={5} columns={3} />
        ) : assignments.length === 0 ? (
          <Notice title="Nothing assigned yet">
            Assignments you create appear here, newest first.
          </Notice>
        ) : (
          <div className="border-hairline bg-card overflow-hidden rounded-xs border">
            <div className="border-hairline text-muted-foreground grid grid-cols-[1fr_1fr_auto] gap-4 border-b px-4 py-2 text-xs font-medium uppercase">
              <span>Member</span>
              <span>Course</span>
              <span className="text-right">Assigned</span>
            </div>
            {assignments.map((assignment) => {
              const member = byUserId.get(assignment.userId);
              const course = courseById.get(assignment.courseId);
              return (
                <div
                  key={assignment.id}
                  className="border-hairline grid grid-cols-[1fr_1fr_auto] items-center gap-4 border-b px-4 py-3 text-sm last:border-0"
                >
                  <span className="min-w-0 truncate">
                    {member ? (
                      memberLabel(member)
                    ) : (
                      // Assigned before they left, or a member list this role
                      // can't read — say which rather than showing a bare id.
                      <span className="text-muted-foreground font-mono text-xs">
                        {assignment.userId.slice(0, 8)}…{" "}
                        <span className="font-sans">(not a current member)</span>
                      </span>
                    )}
                  </span>
                  <span className="min-w-0 truncate">
                    {course?.title ?? (
                      <span className="text-muted-foreground font-mono text-xs">
                        {assignment.courseId.slice(0, 8)}…
                      </span>
                    )}
                  </span>
                  <span className="text-muted-foreground text-right text-xs">
                    {new Date(assignment.assignedAt).toLocaleDateString()}
                    {assignment.activatedAt === null && (
                      <Badge variant="outline" className="ml-2">
                        Not activated
                      </Badge>
                    )}
                  </span>
                </div>
              );
            })}
          </div>
        )}

        {/*
          Said plainly rather than shipped as an empty "0%" column: a manager
          who sees a progress bar assumes it is real. Enrolment rows are
          user-owned and enrollment's RLS never lets one user read another's, so
          the org writes a seat enrolment it cannot read back. Reporting needs
          its own deliberate read on the learning side.
        */}
        <p className="text-muted-foreground text-xs">
          Progress isn&apos;t shown here yet. Member progress is private to the learner by default,
          so reporting it to an org needs a dedicated read rather than widening that rule.
        </p>
      </section>
    </PageLayout>
  );
}

const CourseRow = ({
  course,
  selected,
  onSelect,
}: {
  course: Course;
  selected: boolean;
  onSelect: () => void;
}) => (
  <button
    type="button"
    onClick={onSelect}
    aria-pressed={selected}
    className={`border-hairline flex w-full items-center gap-3 rounded-xs border px-3 py-2 text-left text-sm transition-colors ${
      selected ? "bg-muted" : "hover:bg-muted/50"
    }`}
  >
    <BookOpen className="text-muted-foreground size-4 shrink-0" />
    <span className="min-w-0 flex-1">
      <span className="text-ink block truncate font-medium">{course.title}</span>
      {course.summary && (
        <span className="text-muted-foreground block truncate text-xs">{course.summary}</span>
      )}
    </span>
    {selected && <Badge variant="success">Selected</Badge>}
  </button>
);

const MemberRow = ({
  member,
  checked,
  already,
  disabled,
  onToggle,
}: {
  member: OrgMember;
  checked: boolean;
  already: boolean;
  disabled: boolean;
  onToggle: () => void;
}) => {
  const id = `member-${member.userId}`;
  return (
    <div className="border-hairline flex items-center gap-3 border-b px-3 py-2 text-sm last:border-0">
      <Checkbox id={id} checked={checked} disabled={disabled} onCheckedChange={onToggle} />
      <label htmlFor={id} className="min-w-0 flex-1 cursor-pointer">
        <span className="text-ink block truncate">{memberLabel(member)}</span>
        {member.displayName && member.email && (
          <span className="text-muted-foreground block truncate text-xs">{member.email}</span>
        )}
      </label>
      <span className="text-muted-foreground text-xs capitalize">{member.role}</span>
      {/*
        Assigning again is harmless — the server is idempotent per member and
        keeps their existing enrolment and progress. Saying so up front is
        better than letting the summary explain it afterwards.
      */}
      {already && <Badge variant="outline">Already assigned</Badge>}
    </div>
  );
};

const SelectAll = ({
  members,
  selected,
  disabled,
  onChange,
}: {
  members: OrgMember[];
  selected: Set<string>;
  disabled: boolean;
  onChange: (next: Set<string>) => void;
}) => {
  const allSelected = members.length > 0 && members.every((m) => selected.has(m.userId));
  return (
    <button
      type="button"
      disabled={disabled}
      onClick={() => onChange(allSelected ? new Set() : new Set(members.map((m) => m.userId)))}
      className="text-muted-foreground hover:text-ink text-xs transition-colors disabled:opacity-50"
    >
      {allSelected ? "Clear selection" : `Select all ${members.length}`}
    </button>
  );
};

/**
 * Reports the two lists separately. "Assigned 3, 2 already had it" is the true
 * statement; "assigned 5" is not, and the difference matters to a manager
 * reconciling who they still need to chase.
 */
const AssignSummary = ({
  result,
  byUserId,
}: {
  result: AssignResult;
  byUserId: Map<string, OrgMember>;
}) => {
  const name = (userId: string) => {
    const member = byUserId.get(userId);
    return member ? memberLabel(member) : `${userId.slice(0, 8)}…`;
  };

  return (
    <div className="border-hairline bg-muted/40 space-y-1 rounded-xs border px-4 py-3 text-sm">
      <p className="text-ink font-medium">
        {result.assigned.length} assigned
        {result.alreadyAssigned.length > 0 && `, ${result.alreadyAssigned.length} already had it`}
      </p>
      {result.assigned.length > 0 && (
        <p className="text-muted-foreground">{result.assigned.map(name).join(", ")}</p>
      )}
      {result.alreadyAssigned.length > 0 && (
        <p className="text-muted-foreground text-xs">
          Unchanged: {result.alreadyAssigned.map(name).join(", ")} — their existing enrolment and
          progress are untouched.
        </p>
      )}
    </div>
  );
};

const Notice = ({ title, children }: { title: string; children: React.ReactNode }) => (
  <div className="border-hairline bg-muted/40 rounded-xs border px-4 py-3 text-sm">
    <p className="text-ink font-medium">{title}</p>
    <p className="text-muted-foreground mt-1">{children}</p>
  </div>
);

const Code = ({ children }: { children: React.ReactNode }) => (
  <code className="bg-muted rounded-xs px-1 py-0.5 font-mono text-xs">{children}</code>
);
