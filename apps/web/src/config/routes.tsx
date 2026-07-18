import {
  Award,
  BookOpen,
  Database,
  LayoutDashboard,
  ListChecks,
  NotebookPen,
  Settings,
  Trophy,
  Wallet,
} from "lucide-react";

import type { RouteGroup } from "@datarango/ui";

/** Learner navigation (web app shell). */
export const LEARNER_ROUTES: RouteGroup[] = [
  {
    group: "Learn",
    routes: [
      { href: "/dashboard", label: "Dashboard", icon: LayoutDashboard },
      { href: "/courses", label: "Courses", icon: BookOpen },
      { href: "/quizzes", label: "Quizzes", icon: ListChecks },
      { href: "/notebooks", label: "Notebooks", icon: NotebookPen },
    ],
  },
  {
    group: "Compete",
    routes: [
      { href: "/competitions", label: "Competitions", icon: Trophy },
      { href: "/datasets", label: "Datasets", icon: Database },
    ],
  },
  {
    group: "Progress",
    routes: [
      { href: "/wallet", label: "Wallet", icon: Wallet },
      { href: "/achievements", label: "Achievements", icon: Award },
      { href: "/settings", label: "Settings", icon: Settings },
    ],
  },
];
