import { BarChart3, BookOpen, FileQuestion, Images, ListChecks } from "lucide-react";

import type { RouteGroup } from "@datarango/ui";

/**
 * Creator-context navigation (studio shell). Only Courses is live in Phase 2;
 * the rest are declared disabled so the shell reads as the finished product
 * rather than silently missing sections.
 */
export const STUDIO_ROUTES: RouteGroup[] = [
  {
    group: "Content",
    routes: [
      { href: "/courses", label: "Courses", icon: BookOpen },
      { href: "/quizzes", label: "Quizzes", icon: FileQuestion, disabled: true },
      { href: "/media", label: "Media library", icon: Images, disabled: true },
    ],
  },
  {
    group: "Insights",
    routes: [
      { href: "/review", label: "Review status", icon: ListChecks, disabled: true },
      { href: "/analytics", label: "Analytics", icon: BarChart3, disabled: true },
    ],
  },
];
