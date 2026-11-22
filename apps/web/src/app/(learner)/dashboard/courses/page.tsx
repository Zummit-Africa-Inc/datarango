"use client";

import { Suspense, useMemo } from "react";
import Link from "next/link";

import {
  Badge,
  CatalogueThumbnail,
  listParam,
  ListToolbar,
  PageLayout,
  Pagination,
  parsePrices,
  Price,
  pricingFromPrices,
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
        <ul className="grid gap-5 sm:grid-cols-2 lg:grid-cols-3 2xl:grid-cols-4">
          {courses.map((course) => {
            const isEnrolled = enrolledCourseIds.has(course.id);
            return (
              <li key={course.id}>
                <Link
                  href={`/dashboard/courses/${course.id}`}
                  className="border-border bg-card hover:border-border-strong focus-visible:ring-ring group flex h-full flex-col overflow-hidden rounded-lg border transition-colors outline-none focus-visible:ring-2"
                >
                  <CatalogueThumbnail
                    id={course.id}
                    title={course.title}
                    imageUrl={course.imageUrl}
                  />
                  <div className="flex flex-1 flex-col gap-2 p-4">
                    <h2 className="font-display text-foreground line-clamp-2 text-lg leading-snug font-semibold group-hover:underline group-hover:underline-offset-2">
                      {course.title}
                    </h2>
                    <p className="text-foreground-muted line-clamp-2 flex-1 text-sm">
                      {course.summary || "No summary yet."}
                    </p>
                    <div className="mt-2 flex items-center justify-between gap-3">
                      <span className="text-primary text-sm font-medium">
                        {isEnrolled ? "Continue" : "View course"}
                      </span>
                      {isEnrolled ? (
                        <Badge tone="success" appearance="soft">
                          Enrolled
                        </Badge>
                      ) : (
                        <CoursePrice pricesJson={course.pricesJson} />
                      )}
                    </div>
                  </div>
                </Link>
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

const CoursePrice = ({ pricesJson }: { pricesJson: string }) => {
  const prices = parsePrices(pricesJson);
  return prices ? <Price pricing={pricingFromPrices(prices)} /> : null;
};
