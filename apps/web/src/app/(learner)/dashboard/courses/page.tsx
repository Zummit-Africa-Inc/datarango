"use client";

import { useMemo, useState } from "react";
import Link from "next/link";
import { Search } from "lucide-react";

import { Badge, Button, Input, PageLayout, Skeleton } from "@datarango/ui";

import { useDiscoverCourses, useMyEnrollments } from "@/hooks/learning";

const PAGE_SIZE = 12;

export default function CoursesPage() {
  const [search, setSearch] = useState("");
  const [submitted, setSubmitted] = useState("");
  const [page, setPage] = useState(1);

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
  const lastPage = Math.max(1, Math.ceil(total / PAGE_SIZE));

  const runSearch = (e: React.FormEvent) => {
    e.preventDefault();
    setSubmitted(search.trim());
    // A new search invalidates the page number — page 3 of everything is rarely
    // page 3 of the filtered set.
    setPage(1);
  };

  return (
    <PageLayout title="Courses" subtitle="Everything published on Datarango.">
      <form onSubmit={runSearch} className="flex max-w-md items-center gap-2">
        <Input
          aria-label="Search courses"
          placeholder="Search courses…"
          value={search}
          onChange={(e) => setSearch(e.target.value)}
        />
        <Button type="submit" variant="outline">
          <Search className="size-4" />
          Search
        </Button>
      </form>

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
              <Link
                key={course.id}
                href={`/dashboard/courses/${course.id}`}
                className="border-hairline bg-card hover:border-primary-500/40 flex flex-col rounded-xs border p-5 transition-colors"
              >
                <div className="flex items-start justify-between gap-3">
                  <h2 className="font-heading text-ink text-lg leading-snug">{course.title}</h2>
                  {isEnrolled && <Badge variant="success">Enrolled</Badge>}
                </div>
                <p className="text-muted-foreground mt-2 line-clamp-3 flex-1 text-sm leading-relaxed">
                  {course.summary || "No summary yet."}
                </p>
                <span className="text-primary-500 mt-4 text-sm font-medium">
                  {isEnrolled ? "Continue →" : "View course →"}
                </span>
              </Link>
            );
          })}
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
