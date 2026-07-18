import {
  BarChart3,
  ClipboardCheck,
  CreditCard,
  Gift,
  LayoutDashboard,
  ListChecks,
  Settings,
  Shield,
  Trophy,
  Users,
} from "lucide-react";

import type { RouteGroup } from "@datarango/ui";

/** Org-context navigation (console shell). */
export const ORG_ROUTES: RouteGroup[] = [
  {
    group: "Organization",
    routes: [
      { href: "/overview", label: "Overview", icon: LayoutDashboard },
      { href: "/members", label: "Members", icon: Users },
      { href: "/roles", label: "Roles", icon: Shield },
    ],
  },
  {
    group: "Learning",
    routes: [
      { href: "/assignments", label: "Assignments", icon: ListChecks },
      { href: "/progress", label: "Progress", icon: BarChart3 },
      { href: "/grading", label: "Grading", icon: ClipboardCheck },
      { href: "/competitions", label: "Competitions", icon: Trophy },
    ],
  },
  {
    group: "Billing",
    routes: [
      { href: "/billing", label: "Billing & usage", icon: CreditCard },
      { href: "/rewards", label: "Rewards", icon: Gift, disabled: true },
      { href: "/settings", label: "Settings", icon: Settings },
    ],
  },
];
