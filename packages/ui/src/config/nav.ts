import {
  Compass,
  BarChart3,
  BookOpen,
  Building2,
  ClipboardCheck,
  Coins,
  CreditCard,
  FileQuestion,
  Flag,
  GraduationCap,
  Images,
  LayoutDashboard,
  Layers,
  ListChecks,
  MailWarning,
  NotebookPen,
  ScrollText,
  Settings,
  Shield,
  ShieldCheck,
  Sparkles,
  Trophy,
  Users,
  Wallet,
  type LucideIcon,
} from "lucide-react";

export interface NavItem {
  label: string;
  /** Parents navigate nowhere themselves; their `href` only scopes active-state matching. */
  href: string;
  icon?: LucideIcon;
  /** Org permission (see `@datarango/auth` `ORG_PERMISSIONS`) required to see the item. */
  permission?: string;
  disabled?: boolean;
  /** Extra words the command palette matches on. */
  keywords?: string[];
  children?: NavItem[];
}

export interface NavGroup {
  /** Overline above the group; omit for an unlabelled group. */
  label?: string;
  items: NavItem[];
}

/** Learner app (web `/dashboard`), §9. */
export const LEARNER_NAV: NavGroup[] = [
  {
    items: [
      { label: "Home", href: "/dashboard", icon: LayoutDashboard },
      {
        label: "Learn",
        href: "/dashboard/learn",
        icon: GraduationCap,
        children: [
          {
            label: "My courses",
            href: "/dashboard/my-courses",
            keywords: ["enrolled", "progress"],
          },
          { label: "Certificates", href: "/dashboard/certificates" },
        ],
      },
      {
        label: "Practise",
        href: "/dashboard/practise",
        icon: NotebookPen,
        children: [
          { label: "Notebooks", href: "/dashboard/notebooks", keywords: ["jupyter", "python"] },
          { label: "Quizzes", href: "/dashboard/quizzes" },
          { label: "Datasets", href: "/dashboard/datasets" },
        ],
      },
      {
        label: "Explore",
        href: "/dashboard/courses",
        icon: Compass,
        keywords: ["catalogue", "courses", "browse"],
      },
      { label: "Competitions", href: "/dashboard/competitions", icon: Trophy },
      {
        label: "Rewards",
        href: "/dashboard/rewards",
        icon: Coins,
        children: [
          { label: "Tokens", href: "/dashboard/wallet", keywords: ["wallet", "balance"] },
          { label: "Badges", href: "/dashboard/achievements", keywords: ["achievements"] },
        ],
      },
    ],
  },
  {
    items: [{ label: "Settings", href: "/dashboard/settings", icon: Settings }],
  },
];

/** Creator studio, §9. */
export const CREATOR_NAV: NavGroup[] = [
  {
    items: [
      {
        label: "Content",
        href: "/content",
        icon: Layers,
        children: [
          { label: "Courses", href: "/courses", icon: BookOpen },
          { label: "Quizzes", href: "/quizzes", icon: FileQuestion },
          { label: "Media library", href: "/media", icon: Images, keywords: ["video", "upload"] },
          { label: "Review status", href: "/review", icon: ListChecks, keywords: ["moderation"] },
        ],
      },
      { label: "Grading", href: "/grading", icon: ClipboardCheck, keywords: ["submissions"] },
      { label: "Analytics", href: "/analytics", icon: BarChart3, disabled: true },
    ],
  },
];

/** Org admin console (B2B), §9. */
export const ORG_NAV: NavGroup[] = [
  {
    items: [
      { label: "Dashboard", href: "/overview", icon: LayoutDashboard },
      {
        label: "People",
        href: "/people",
        icon: Users,
        children: [
          { label: "Members", href: "/members", permission: "org.members.view" },
          { label: "Roles", href: "/roles", permission: "org.roles.manage" },
        ],
      },
      {
        label: "Learning",
        href: "/learning",
        icon: BookOpen,
        children: [
          { label: "Assignments", href: "/assignments", permission: "org.courses.assign" },
          {
            label: "Competitions",
            href: "/competitions",
            permission: "org.competitions.manage",
          },
          { label: "Grading", href: "/grading", permission: "org.grading.grade" },
        ],
      },
      {
        label: "Reports",
        href: "/progress",
        icon: BarChart3,
        permission: "org.reports.view",
        keywords: ["progress"],
      },
      {
        label: "Billing",
        href: "/billing",
        icon: CreditCard,
        permission: "org.billing.view",
        keywords: ["seats", "invoices", "usage"],
      },
      {
        label: "Settings",
        href: "/org-settings",
        icon: Settings,
        children: [
          {
            label: "Organisation",
            href: "/settings",
            permission: "org.settings.manage",
            keywords: ["sso", "domains"],
          },
          {
            label: "AI providers",
            href: "/ai",
            icon: Sparkles,
            permission: "org.settings.manage",
            keywords: ["byok", "keys"],
          },
        ],
      },
    ],
  },
];

/** Platform admin, §9. */
export const ADMIN_NAV: NavGroup[] = [
  {
    items: [
      { label: "Overview", href: "/overview", icon: LayoutDashboard },
      { label: "Users", href: "/users", icon: Users },
      { label: "Organisations", href: "/organizations", icon: Building2 },
      { label: "Moderation queue", href: "/review", icon: ShieldCheck, keywords: ["review"] },
      { label: "Reward rules", href: "/rewards", icon: Coins, keywords: ["tokens", "economy"] },
      { label: "Billing operations", href: "/billing", icon: Wallet, keywords: ["payments"] },
      {
        label: "System",
        href: "/system",
        icon: Shield,
        children: [
          { label: "Notifications", href: "/notifications", icon: MailWarning },
          { label: "Audit log", href: "/audit", icon: ScrollText },
          { label: "Feature flags", href: "/flags", icon: Flag },
        ],
      },
    ],
  },
];

/**
 * Drops items the user may not see, and parents left with no children.
 *
 * @param nav - A nav tree.
 * @param can - Permission check; items without a `permission` always pass.
 * @returns The filtered tree.
 * @example filterNav(ORG_NAV, (p) => hasPermission(membership, p))
 */
export const filterNav = (nav: NavGroup[], can: (permission: string) => boolean): NavGroup[] => {
  const keep = (item: NavItem): NavItem | null => {
    if (item.permission && !can(item.permission)) return null;
    if (!item.children) return item;
    const children = item.children.map(keep).filter((c): c is NavItem => c !== null);
    return children.length ? { ...item, children } : null;
  };
  return nav
    .map((group) => ({
      ...group,
      items: group.items.map(keep).filter((i): i is NavItem => i !== null),
    }))
    .filter((group) => group.items.length > 0);
};

/** Every navigable leaf, with its parent's label (for palette hints and breadcrumbs). */
export const flattenNav = (nav: NavGroup[]): (NavItem & { parent?: string })[] =>
  nav.flatMap((group) =>
    group.items.flatMap((item) =>
      item.children ? item.children.map((child) => ({ ...child, parent: item.label })) : [item],
    ),
  );

/**
 * The href of the leaf that owns `pathname`: the longest leaf href equal to it or
 * a parent path of it, so `/dashboard/courses/42` lights up "My courses" not "Home".
 */
export const findActiveHref = (nav: NavGroup[], pathname: string): string | null => {
  let best: string | null = null;
  for (const { href } of flattenNav(nav)) {
    const matches = pathname === href || pathname.startsWith(`${href}/`);
    if (matches && (!best || href.length > best.length)) best = href;
  }
  return best;
};
