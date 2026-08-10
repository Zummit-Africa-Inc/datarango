import {
  BarChart3,
  BookOpen,
  ClipboardCheck,
  FileQuestion,
  Images,
  ListChecks,
} from "lucide-react";

import type { RouteGroup } from "@datarango/ui";

/**
 * Creator-context navigation (studio shell). Courses and Quizzes are live in
 * Phase 2; the rest are declared disabled so the shell reads as the finished
 * product rather than silently missing sections.
 */
export const STUDIO_ROUTES: RouteGroup[] = [
  {
    group: "Content",
    routes: [
      { href: "/courses", label: "Courses", icon: BookOpen },
      { href: "/quizzes", label: "Quizzes", icon: FileQuestion },
      { href: "/media", label: "Media library", icon: Images, disabled: true },
    ],
  },
  {
    group: "Insights",
    routes: [
      // Above the disabled entries because it is the one thing here a creator
      // has to act on — learners are waiting on it.
      { href: "/grading", label: "Grading", icon: ClipboardCheck },
      { href: "/review", label: "Review status", icon: ListChecks, disabled: true },
      { href: "/analytics", label: "Analytics", icon: BarChart3, disabled: true },
    ],
  },
];
