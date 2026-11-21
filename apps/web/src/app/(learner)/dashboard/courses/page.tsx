"use client";

import { Suspense, useMemo } from "react";
import Image from "next/image";
import Link from "next/link";

import {
  Badge,
  Button,
  listParam,
  ListToolbar,
  PageLayout,
  Pagination,
  Skeleton,
  useListParams,
} from "@datarango/ui";

import { useDiscoverCourses, useMyEnrollments } from "@/hooks/learning";

const PAGE_SIZE = 12;

export default function CoursesPage() {
  return (
    <Suspense fallback={<Skeleton skeleton="list" rows={6} />}>
      <CoursesList />
    </Suspense>
  );
}

const CoursesList = () => {
  const { params, set } = useListParams({ q: listParam.string(), page: listParam.number(1) });
  const { q: submitted, page } = params;

  const { data, isLoading } = useDiscoverCourses({
    search: submitted,
    page,
    pageSize: PAGE_SIZE,
  });
  const { data: enrolled } = useMyEnrollments();

  // Enrolment is what turns "View course" into "Continue", so the set is worth
  // computing once rather than scanning the list per card.
  const enrolledCourseIds = useMemo(
    () => new Set((enrolled?.enrollments ?? []).map((e) => e.courseId)),
    [enrolled],
  );

  const courses = data?.courses ?? [];
  const total = data?.total ?? 0;

  return (
    <PageLayout title="Courses" subtitle="Everything published on Datarango.">
      <ListToolbar
        search={{ value: submitted, onChange: (q) => set({ q }), placeholder: "Search courses…" }}
      />

      {isLoading ? (
        <Skeleton skeleton="list" rows={6} />
      ) : courses.length === 0 ? (
        <div className="border-hairline bg-card rounded-xs border px-6 py-16 text-center">
          <p className="font-heading text-ink text-lg">
            {submitted ? "Nothing matches that search" : "No courses published yet"}
          </p>
          <p className="text-muted-foreground mt-1 text-sm">
            {submitted
              ? "Try a different term."
              : "Once creators publish, their courses show up here."}
          </p>
        </div>
      ) : (
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {courses.map((course) => {
            const isEnrolled = enrolledCourseIds.has(course.id);
            return (
              <div
                className="border-hairline bg-card hover:border-primary-500/40 flex flex-col rounded-xs border transition-colors"
                key={course.id}
              >
                {/*
                  Cover URLs are creator-supplied and can name any host, so
                  optimization is off: next/image's server-side loader would
                  otherwise need an allowlist of every host on earth (or fetch
                  attacker-chosen URLs itself). The browser loads the bytes
                  straight from the origin, same as a plain img — unoptimized
                  just keeps Next's lint and pipeline happy about it.
                */}
                {course.imageUrl ? (
                  <div className="bg-muted relative h-40 w-full">
                    <Image
                      src={course.imageUrl}
                      alt=""
                      fill
                      sizes="(min-width: 1024px) 33vw, (min-width: 640px) 50vw, 100vw"
                      className="object-cover"
                      unoptimized
                    />
                  </div>
                ) : (
                  <div className="bg-primary-500 relative h-40 w-full" />
                )}
                <div className="flex-1 space-y-4 p-4">
                  <div className="flex items-start justify-between gap-3">
                    <h2 className="font-heading text-ink text-xl leading-snug">{course.title}</h2>
                    {isEnrolled && <Badge variant="success">Enrolled</Badge>}
                  </div>
                  <p className="text-muted-foreground mt-2 line-clamp-3 flex-1 text-sm leading-relaxed">
                    {course.summary || "No summary yet."}
                  </p>
                  <Button asChild>
                    <Link href={`/dashboard/courses/${course.id}`}>
                      {isEnrolled ? "Continue →" : "View course →"}
                    </Link>
                  </Button>
                </div>
              </div>
            );
          })}
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
