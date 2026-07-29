"use client";

import { Badge } from "@datarango/ui";

import type { CourseStatus } from "@/hooks/catalog";

const VARIANT: Record<CourseStatus, "outline" | "warning" | "success" | "ghost"> = {
  draft: "outline",
  review: "warning",
  published: "success",
  archived: "ghost",
};

export const CourseStatusBadge = ({ status }: { status: CourseStatus }) => (
  <Badge variant={VARIANT[status]} className="capitalize">
    {status}
  </Badge>
);
