"use client";

import { Suspense } from "react";

import { Skeleton } from "@datarango/ui";

import { CourseCatalogue } from "@/components/learning/course-catalogue";

export default function CoursesPage() {
  return (
    <Suspense fallback={<Skeleton skeleton="list" count={6} />}>
      <CourseCatalogue defaultTab="all" />
    </Suspense>
  );
}
