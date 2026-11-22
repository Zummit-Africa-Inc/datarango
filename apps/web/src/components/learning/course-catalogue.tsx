"use client";

import { BookOpen, Search } from "lucide-react";
import Link from "next/link";
import { useMemo } from "react";

import {
  Badge,
  Button,
  CatalogueThumbnail,
  EmptyState,
  ListToolbar,
  PageLayout,
  Pagination,
  ProgressRing,
  Skeleton,
  Tabs,
  TabsList,
  TabsTrigger,
  listParam,
  useListParams,
} from "@datarango/ui";

import { CourseCard, CoursePrice } from "@/components/learning/course-card";
import {
  useCourseProgress,
  useCourseTree,
  useDiscoverCourses,
  useMyEnrollments,
  type Course,
  type Enrollment,
} from "@/hooks/learning";

const TABS = ["all", "in-progress", "completed"] as const;
type Tab = (typeof TABS)[number];

const TAB_LABELS: Record<Tab, string> = {
  all: "All",
  "in-progress": "In progress",
  completed: "Completed",
};

const PAGE_SIZES = [12, 24, 48];

const GRID = "grid gap-5 sm:grid-cols-2 lg:grid-cols-3 2xl:grid-cols-4";

/**
 * Course catalogue (§7.3) with All · In progress · Completed tabs, grid/list
 * view and page size, all in the URL. "All" is the published catalogue,
 * searched and paged by the API. The other two tabs are the learner's own
 * enrolments, paged in the browser because the enrolment list is complete.
 * "Saved" waits for bookmarks to exist (contract-gaps.md).
 */
export const CourseCatalogue = ({ defaultTab }: { defaultTab: Tab }) => {
  const { params, set } = useListParams({
    tab: listParam.oneOf(TABS, defaultTab),
    q: listParam.string(),
    page: listParam.number(1),
    size: listParam.number(12),
    view: listParam.oneOf(["grid", "list"] as const, "grid"),
  });
  const { tab, q, page, size, view } = params;

  const { data: enrolled } = useMyEnrollments();
  const enrollments = useMemo(() => enrolled?.enrollments ?? [], [enrolled]);
  const enrolledIds = useMemo(() => new Set(enrollments.map((e) => e.courseId)), [enrollments]);
  const counts = {
    "in-progress": enrollments.filter((e) => !e.completedAt).length,
    completed: enrollments.filter((e) => e.completedAt).length,
  };

  return (
    <PageLayout
      title={defaultTab === "all" ? "All courses" : "My courses"}
      subtitle={
        defaultTab === "all"
          ? "Everything published on Datarango."
          : "Courses you've enrolled in, and how far you've got."
      }
    >
      <Tabs value={tab} onValueChange={(next) => set({ tab: next as Tab, q: "" })}>
        <TabsList>
          {TABS.map((value) => (
            <TabsTrigger key={value} value={value}>
              {TAB_LABELS[value]}
              {value !== "all" && (
                <span className="text-foreground-subtle ml-1.5 font-mono text-xs">
                  {counts[value]}
                </span>
              )}
            </TabsTrigger>
          ))}
        </TabsList>
      </Tabs>

      <ListToolbar
        search={
          tab === "all"
            ? { value: q, onChange: (next) => set({ q: next }), placeholder: "Search courses…" }
            : undefined
        }
        view={{ value: view, onChange: (next) => set({ view: next }) }}
      />

      {tab === "all" ? (
        <AllCourses
          search={q}
          page={page}
          size={size}
          view={view}
          enrolledIds={enrolledIds}
          onPage={(next) => set({ page: next })}
          onSize={(next) => set({ size: next })}
        />
      ) : (
        <EnrolledCourses
          enrollments={enrollments.filter((e) =>
            tab === "completed" ? e.completedAt : !e.completedAt,
          )}
          loading={!enrolled}
          tab={tab}
          page={page}
          size={size}
          view={view}
          onPage={(next) => set({ page: next })}
          onSize={(next) => set({ size: next })}
        />
      )}
    </PageLayout>
  );
};

interface PagingProps {
  page: number;
  size: number;
  view: "grid" | "list";
  onPage: (page: number) => void;
  onSize: (size: number) => void;
}

const AllCourses = ({
  search,
  enrolledIds,
  page,
  size,
  view,
  onPage,
  onSize,
}: PagingProps & { search: string; enrolledIds: Set<string> }) => {
  const { data, isLoading } = useDiscoverCourses({ search, page, pageSize: size });
  const courses = data?.courses ?? [];
  const total = data?.total ?? 0;

  if (isLoading) return <Skeleton skeleton="list" count={6} />;
  if (courses.length === 0) {
    return (
      <EmptyState
        icon={search ? Search : BookOpen}
        title={search ? "Nothing matches that search" : "No courses published yet"}
        hint={
          search ? "Try a different term." : "Once creators publish, their courses show up here."
        }
      />
    );
  }

  return (
    <>
      {view === "grid" ? (
        <ul className={GRID}>
          {courses.map((course) => (
            <li key={course.id}>
              <CourseCard course={course} enrolled={enrolledIds.has(course.id)} />
            </li>
          ))}
        </ul>
      ) : (
        <ul className="border-border bg-card divide-border divide-y overflow-hidden rounded-lg border">
          {courses.map((course) => (
            <CourseRow key={course.id} course={course} enrolled={enrolledIds.has(course.id)} />
          ))}
        </ul>
      )}
      <Pagination
        page={page}
        pageSize={size}
        total={total}
        noun="course"
        onPageChange={onPage}
        onPageSizeChange={onSize}
        pageSizes={PAGE_SIZES}
      />
    </>
  );
};

const EnrolledCourses = ({
  enrollments,
  loading,
  tab,
  page,
  size,
  view,
  onPage,
  onSize,
}: PagingProps & { enrollments: Enrollment[]; loading: boolean; tab: Tab }) => {
  const sorted = useMemo(
    () => [...enrollments].sort((a, b) => b.createdAt.localeCompare(a.createdAt)),
    [enrollments],
  );
  const visible = sorted.slice((page - 1) * size, page * size);

  if (loading) return <Skeleton skeleton="list" count={6} />;
  if (sorted.length === 0) {
    return (
      <EmptyState
        icon={BookOpen}
        accent="lime"
        title={tab === "completed" ? "Nothing completed yet" : "Nothing in progress"}
        hint={
          tab === "completed"
            ? "Finish every lesson in a course and it lands here, with its certificate."
            : "Enrol in a course and it shows up here with your progress."
        }
        action={
          <Button asChild size="sm">
            <Link href="/dashboard/courses">Browse courses</Link>
          </Button>
        }
      />
    );
  }

  return (
    <>
      {view === "grid" ? (
        <ul className={GRID}>
          {visible.map((enrollment) => (
            <li key={enrollment.id}>
              <EnrolledCard enrollment={enrollment} />
            </li>
          ))}
        </ul>
      ) : (
        <ul className="border-border bg-card divide-border divide-y overflow-hidden rounded-lg border">
          {visible.map((enrollment) => (
            <EnrolledRow key={enrollment.id} enrollment={enrollment} />
          ))}
        </ul>
      )}
      <Pagination
        page={page}
        pageSize={size}
        total={sorted.length}
        noun="course"
        onPageChange={onPage}
        onPageSizeChange={onSize}
        pageSizes={PAGE_SIZES}
      />
    </>
  );
};

/** List view row (§7.3): 120px thumbnail, title and summary, then price or status. */
const CourseRow = ({ course, enrolled }: { course: Course; enrolled: boolean }) => (
  <li>
    <Link
      href={`/dashboard/courses/${course.id}`}
      className="hover:bg-muted/60 flex items-center gap-4 p-3 transition-colors sm:p-4"
    >
      <CatalogueThumbnail
        id={course.id}
        title={course.title}
        imageUrl={course.imageUrl}
        className="w-24 shrink-0 rounded-md sm:w-30"
      />
      <div className="min-w-0 flex-1">
        <p className="font-display text-foreground truncate font-semibold">{course.title}</p>
        <p className="text-foreground-muted mt-0.5 line-clamp-2 text-sm">
          {course.summary || "No summary yet."}
        </p>
      </div>
      <div className="shrink-0">
        {enrolled ? (
          <Badge tone="success" appearance="soft">
            Enrolled
          </Badge>
        ) : (
          <CoursePrice pricesJson={course.pricesJson} />
        )}
      </div>
    </Link>
  </li>
);

/** An enrolment resolved through its course tree (works even if the course left the catalogue). */
const useEnrolledCourse = (enrollment: Enrollment) => {
  const { data: tree } = useCourseTree(enrollment.courseId);
  const { data: progress } = useCourseProgress(enrollment.courseId, true);
  return {
    title: tree?.course.title ?? "Untitled course",
    summary: tree?.course.summary ?? "",
    imageUrl: tree?.course.imageUrl ?? null,
    percent: enrollment.completedAt ? 100 : (progress?.percentComplete ?? 0),
    href: `/dashboard/courses/${enrollment.courseId}`,
  };
};

const EnrolledStatus = ({ percent }: { percent: number }) =>
  percent >= 100 ? (
    <Badge tone="success" appearance="soft">
      Completed
    </Badge>
  ) : percent === 0 ? (
    <span className="text-foreground-muted text-sm">Not started</span>
  ) : (
    <ProgressRing value={percent} size={40} thickness={5} accent="lime" showValue />
  );

const EnrolledCard = ({ enrollment }: { enrollment: Enrollment }) => {
  const course = useEnrolledCourse(enrollment);
  return (
    <Link
      href={course.href}
      className="border-border bg-card hover:border-border-strong focus-visible:ring-ring group flex h-full flex-col overflow-hidden rounded-lg border transition-colors outline-none focus-visible:ring-2"
    >
      <CatalogueThumbnail
        id={enrollment.courseId}
        title={course.title}
        imageUrl={course.imageUrl}
      />
      <div className="flex flex-1 flex-col gap-2 p-4">
        <h3 className="font-display text-foreground line-clamp-2 text-lg leading-snug font-semibold group-hover:underline group-hover:underline-offset-2">
          {course.title}
        </h3>
        <p className="text-foreground-muted line-clamp-2 flex-1 text-sm">
          {enrollment.grantedByOrgId ? "Assigned by your organisation" : course.summary}
        </p>
        <div className="mt-2 flex items-center justify-between gap-3">
          <span className="text-primary text-sm font-medium">
            {course.percent >= 100 ? "Review" : course.percent > 0 ? "Continue" : "Start"}
          </span>
          <EnrolledStatus percent={course.percent} />
        </div>
      </div>
    </Link>
  );
};

const EnrolledRow = ({ enrollment }: { enrollment: Enrollment }) => {
  const course = useEnrolledCourse(enrollment);
  return (
    <li>
      <Link
        href={course.href}
        className="hover:bg-muted/60 flex items-center gap-4 p-3 transition-colors sm:p-4"
      >
        <CatalogueThumbnail
          id={enrollment.courseId}
          title={course.title}
          imageUrl={course.imageUrl}
          className="w-24 shrink-0 rounded-md sm:w-30"
        />
        <div className="min-w-0 flex-1">
          <p className="font-display text-foreground truncate font-semibold">{course.title}</p>
          <p className="text-foreground-muted mt-0.5 line-clamp-2 text-sm">
            {enrollment.grantedByOrgId ? "Assigned by your organisation" : course.summary}
          </p>
        </div>
        <div className="shrink-0">
          <EnrolledStatus percent={course.percent} />
        </div>
      </Link>
    </li>
  );
};
