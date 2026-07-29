"use client";

import { useState } from "react";
import Link from "next/link";

import { Button, PageLayout, Skeleton } from "@datarango/ui";

import { CourseStatusBadge } from "@/components/course-status-badge";
import { CreateCourseDialog } from "@/components/create-course-dialog";
import { useMyCourses, type CourseStatus } from "@/hooks/catalog";

const PAGE_SIZE = 20;

const FILTERS: { label: string; value: CourseStatus | "all" }[] = [
  { label: "All", value: "all" },
  { label: "Draft", value: "draft" },
  { label: "In review", value: "review" },
  { label: "Published", value: "published" },
  { label: "Archived", value: "archived" },
];

export default function CoursesPage() {
  const [status, setStatus] = useState<CourseStatus | "all">("all");
  const [page, setPage] = useState(1);

  const { data, isLoading } = useMyCourses({
    status: status === "all" ? undefined : status,
    page,
    pageSize: PAGE_SIZE,
  });

  const courses = data?.courses ?? [];
  const total = data?.total ?? 0;
  const lastPage = Math.max(1, Math.ceil(total / PAGE_SIZE));

  const changeFilter = (next: CourseStatus | "all") => {
    setStatus(next);
    // A filter change invalidates the current page number — page 3 of "all"
    // is rarely page 3 of "draft".
    setPage(1);
  };

  return (
    <PageLayout
      title="Courses"
      subtitle="Everything you're authoring."
      actions={[<CreateCourseDialog key="create" />]}
    >
      <div className="flex flex-wrap items-center gap-2">
        {FILTERS.map((filter) => (
          <Button
            key={filter.value}
            size="sm"
            variant={status === filter.value ? "default" : "outline"}
            onClick={() => changeFilter(filter.value)}
          >
            {filter.label}
          </Button>
        ))}
      </div>

      {isLoading ? (
        <Skeleton skeleton="table" rows={5} columns={3} />
      ) : courses.length === 0 ? (
        <div className="border-hairline bg-card rounded-xs border px-6 py-16 text-center">
          <p className="font-heading text-ink text-lg">
            {status === "all" ? "No courses yet" : `No ${status} courses`}
          </p>
          <p className="text-muted-foreground mt-1 text-sm">
            {status === "all"
              ? "Create your first course to start building modules and lessons."
              : "Try a different filter."}
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

      {lastPage > 1 && (
        <div className="flex items-center justify-between">
          <p className="text-muted-foreground text-sm">
            Page {page} of {lastPage} · {total} course{total === 1 ? "" : "s"}
          </p>
          <div className="flex gap-2">
            <Button
              size="sm"
              variant="outline"
              disabled={page <= 1}
              onClick={() => setPage((p) => p - 1)}
            >
              Previous
            </Button>
            <Button
              size="sm"
              variant="outline"
              disabled={page >= lastPage}
              onClick={() => setPage((p) => p + 1)}
            >
              Next
            </Button>
          </div>
        </div>
      )}
    </PageLayout>
  );
}
