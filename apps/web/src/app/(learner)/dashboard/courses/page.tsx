"use client";

import { Suspense, useMemo } from "react";

import {
  listParam,
  ListToolbar,
  PageLayout,
  Pagination,
  Skeleton,
  useListParams,
} from "@datarango/ui";

import { CourseCard } from "@/components/learning/course-card";

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
        <ul className="grid gap-5 sm:grid-cols-2 lg:grid-cols-3 2xl:grid-cols-4">
          {courses.map((course) => {
            const isEnrolled = enrolledCourseIds.has(course.id);
            return (
              <li key={course.id}>
                <CourseCard course={course} enrolled={isEnrolled} />
              </li>
            );
          })}
        </ul>
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
