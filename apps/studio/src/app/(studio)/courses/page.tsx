"use client";

import { Suspense } from "react";
import Link from "next/link";

import {
  ListToolbar,
  PageLayout,
  Pagination,
  Skeleton,
  listParam,
  useListParams,
} from "@datarango/ui";

import { CourseStatusBadge } from "@/components/course-status-badge";
import { CreateCourseDialog } from "@/components/create-course-dialog";
import { useMyCourses, type CourseStatus } from "@/hooks/catalog";

const PAGE_SIZE = 20;

const STATUSES = ["draft", "review", "published", "archived"] as const satisfies CourseStatus[];

const STATUS_OPTIONS = [
  { label: "Draft", value: "draft" },
  { label: "In review", value: "review" },
  { label: "Published", value: "published" },
  { label: "Archived", value: "archived" },
];

export default function CoursesPage() {
  return (
    <Suspense fallback={<Skeleton skeleton="table" rows={5} columns={3} />}>
      <CourseList />
    </Suspense>
  );
}

const CourseList = () => {
  const { params, set, reset } = useListParams({
    status: listParam.manyOf(STATUSES),
    page: listParam.number(1),
  });
  // The API filters on one status at a time, so the filter is single-select.
  const status = params.status[0];
  const page = params.page;

  const { data, isLoading } = useMyCourses({
    status,
    page,
    pageSize: PAGE_SIZE,
  });

  const courses = data?.courses ?? [];
  const total = data?.total ?? 0;

  return (
    <PageLayout
      title="Courses"
      subtitle="Everything you're authoring."
      actions={[<CreateCourseDialog key="create" />]}
    >
      <ListToolbar
        filters={[
          {
            key: "status",
            label: "Status",
            options: STATUS_OPTIONS,
            value: params.status,
            onChange: (value) => set({ status: value as CourseStatus[] }),
          },
        ]}
        onClearAll={reset}
      />

      {isLoading ? (
        <Skeleton skeleton="table" rows={5} columns={3} />
      ) : courses.length === 0 ? (
        <div className="border-hairline bg-card rounded-xs border px-6 py-16 text-center">
          <p className="font-heading text-ink text-lg">
            {status ? "No courses match these filters" : "No courses yet"}
          </p>
          <p className="text-muted-foreground mt-1 text-sm">
            {status
              ? "Try a different filter."
              : "Create your first course to start building modules and lessons."}
          </p>
        </div>
      ) : (
        <div className="border-hairline bg-card overflow-hidden rounded-xs border">
          <div className="border-hairline text-muted-foreground grid grid-cols-[1fr_auto_auto] gap-4 border-b px-4 py-2 text-xs font-medium uppercase">
            <span>Course</span>
            <span>Status</span>
            <span className="text-right">Updated</span>
          </div>
          {courses.map((course) => (
            <Link
              key={course.id}
              href={`/courses/${course.id}`}
              className="border-hairline hover:bg-muted/50 grid grid-cols-[1fr_auto_auto] items-center gap-4 border-b px-4 py-3 text-sm transition-colors last:border-0"
            >
              <div className="min-w-0">
                <p className="text-ink truncate font-medium">{course.title}</p>
                <p className="text-muted-foreground truncate font-mono text-xs">{course.slug}</p>
              </div>
              <CourseStatusBadge status={course.status} />
              <span className="text-muted-foreground text-right text-xs">
                {new Date(course.updatedAt).toLocaleDateString()}
              </span>
            </Link>
          ))}
        </div>
      )}

      <Pagination
        page={page}
        pageSize={PAGE_SIZE}
        total={total}
        noun="course"
        onPageChange={(next) => set({ page: next })}
      />
    </PageLayout>
  );
};
