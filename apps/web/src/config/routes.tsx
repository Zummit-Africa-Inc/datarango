import {
  Award,
  BadgeCheck,
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
      { href: "/dashboard/courses", label: "Courses", icon: BookOpen },
      { href: "/dashboard/quizzes", label: "Quizzes", icon: ListChecks },
      { href: "/dashboard/notebooks", label: "Notebooks", icon: NotebookPen },
    ],
  },
  {
    group: "Compete",
    routes: [
      { href: "/dashboard/competitions", label: "Competitions", icon: Trophy },
      { href: "/dashboard/datasets", label: "Datasets", icon: Database },
    ],
  },
  {
    group: "Progress",
    routes: [
      { href: "/dashboard/certificates", label: "Certificates", icon: BadgeCheck },
      { href: "/dashboard/wallet", label: "Wallet", icon: Wallet },
      { href: "/dashboard/achievements", label: "Achievements", icon: Award },
      { href: "/dashboard/settings", label: "Settings", icon: Settings },
    ],
  },
];
