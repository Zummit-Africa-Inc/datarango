"use client";

import { Menu, Search } from "lucide-react";
import { usePathname } from "next/navigation";
import { useMemo, type ReactNode } from "react";

import { flattenNav, type NavGroup } from "../../../config/nav";
import { buildBreadcrumbs, normalize } from "../../../lib";
import { Breadcrumb } from "../bread-crumb";
import { ThemeToggle } from "../theme";
import { useCommandPalette, usePaletteShortcut } from "./command-palette";
import { UserAvatarMenu, type UserMenuProps } from "./user-menu";

export interface TopBarProps {
  nav: NavGroup[];
  /** Pathnames that show `greeting` instead of breadcrumbs (app home pages). */
  overviewPaths?: string[];
  greeting?: { title: string; subtitle?: string };
  searchPlaceholder?: string;
  /** Right-hand slot before the theme toggle: notifications, token balance… */
  actions?: ReactNode;
  onOpenMenu: () => void;
  userMenu: UserMenuProps;
}

/** Top bar (§9): breadcrumbs or greeting, palette trigger, actions, theme, avatar on mobile. */
export const TopBar = ({
  nav,
  overviewPaths = [],
  greeting,
  searchPlaceholder = "Search…",
  actions,
  onOpenMenu,
  userMenu,
}: TopBarProps) => {
  const pathname = normalize(usePathname());
  const palette = useCommandPalette();
  const shortcut = usePaletteShortcut();

  const crumbs = useMemo(() => {
    const labels = new Map(flattenNav(nav).map((item) => [item.href, item.label]));
    return buildBreadcrumbs(pathname).map((crumb) => ({
      ...crumb,
      label: labels.get(crumb.href) ?? crumb.label,
    }));
  }, [nav, pathname]);

  const isOverview = overviewPaths.includes(pathname);

  return (
    <header className="border-border bg-background/85 sticky top-0 z-20 flex h-16 shrink-0 items-center gap-3 border-b px-4 backdrop-blur sm:px-6">
      <button
        type="button"
        onClick={onOpenMenu}
        aria-label="Open navigation"
        className="text-foreground-muted hover:bg-muted hover:text-foreground focus-visible:ring-ring -ml-1 inline-flex size-10 items-center justify-center rounded-sm outline-none focus-visible:ring-2 lg:hidden"
      >
        <Menu className="size-5" />
      </button>

      <div className="min-w-0 flex-1">
        {isOverview && greeting ? (
          <div className="min-w-0">
            <p className="font-display text-foreground truncate text-lg leading-tight font-semibold">
              {greeting.title}
            </p>
            {greeting.subtitle && (
              <p className="text-foreground-muted truncate text-xs">{greeting.subtitle}</p>
            )}
          </div>
        ) : (
          <Breadcrumb items={crumbs} className="min-w-0 overflow-hidden" />
        )}
      </div>

      <button
        type="button"
        onClick={palette.open}
        aria-label="Search"
        aria-keyshortcuts="Control+K Meta+K /"
        className="border-border bg-surface text-foreground-subtle hover:border-border-strong hover:text-foreground-muted focus-visible:ring-ring hidden h-10 w-72 items-center gap-2 rounded-md border px-3 text-sm outline-none focus-visible:ring-2 md:flex"
      >
        <Search aria-hidden="true" className="size-4" />
        <span className="truncate">{searchPlaceholder}</span>
        <kbd className="border-border ml-auto shrink-0 rounded-xs border px-1.5 font-mono text-[0.6875rem] whitespace-nowrap">
          {shortcut}
        </kbd>
      </button>

      <div className="flex items-center gap-1">
        <button
          type="button"
          onClick={palette.open}
          aria-label="Search"
          className="text-foreground-muted hover:bg-muted hover:text-foreground focus-visible:ring-ring inline-flex size-10 items-center justify-center rounded-sm outline-none focus-visible:ring-2 md:hidden"
        >
          <Search className="size-[18px]" />
        </button>
        {actions}
        <ThemeToggle className="size-10" />
        <span className="ml-1 lg:hidden">
          <UserAvatarMenu {...userMenu} />
        </span>
      </div>
    </header>
  );
};
