import {
  Building2,
  ClipboardList,
  Coins,
  CreditCard,
  Flag,
  LayoutDashboard,
  ScrollText,
  Users,
} from "lucide-react";

import type { RouteGroup } from "@datarango/ui";

/** Platform-staff navigation (admin shell). */
export const ADMIN_ROUTES: RouteGroup[] = [
  {
    group: "Platform",
    routes: [
      { href: "/overview", label: "Overview", icon: LayoutDashboard },
      { href: "/review", label: "Review queue", icon: ClipboardList },
      { href: "/users", label: "Users", icon: Users },
      { href: "/organizations", label: "Organizations", icon: Building2 },
    ],
  },
  {
    group: "Economy",
    routes: [
      { href: "/billing", label: "Billing ops", icon: CreditCard },
      { href: "/rewards", label: "Reward rules", icon: Coins },
    ],
  },
  {
    group: "System",
    routes: [
      { href: "/audit", label: "Audit log", icon: ScrollText },
      { href: "/flags", label: "Feature flags", icon: Flag },
    ],
  },
];
