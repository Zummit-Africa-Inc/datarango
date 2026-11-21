"use client";

import { usePathname } from "next/navigation";
import { useEffect, useState, type ReactNode } from "react";

import type { NavGroup } from "../../../config/nav";
import { Sheet, SheetContent, SheetDescription, SheetTitle } from "../../ui/sheet";
import { TooltipProvider } from "../../ui/tooltip";
import { AppSidebar, type SidebarPrimaryAction } from "./app-sidebar";
import { CommandPaletteProvider, type PaletteCommandGroup } from "./command-palette";
import { TopBar } from "./top-bar";
import { UserCard, type UserMenuProps } from "./user-menu";

const COLLAPSED_KEY = "datarango.sidebar.collapsed";

export interface AppShellProps extends UserMenuProps {
  nav: NavGroup[];
  homeHref: string;
  product?: string;
  primaryAction?: SidebarPrimaryAction;
  /** Org switcher, rendered above the user card. */
  orgSwitcher?: (collapsed: boolean) => ReactNode;
  overviewPaths?: string[];
  greeting?: { title: string; subtitle?: string };
  searchPlaceholder?: string;
  /** Free-text search from the palette. */
  onSearch?: (query: string) => void;
  commands?: PaletteCommandGroup[];
  topBarActions?: ReactNode;
  children: ReactNode;
}

const readCollapsed = () => {
  try {
    return localStorage.getItem(COLLAPSED_KEY) === "1";
  } catch {
    return false;
  }
};

/**
 * The app shell (§9): collapsible sidebar (sheet on mobile), top bar, command palette.
 * Collapsed state is remembered per browser.
 */
export const AppShell = ({
  nav,
  homeHref,
  product,
  primaryAction,
  orgSwitcher,
  overviewPaths,
  greeting,
  searchPlaceholder,
  onSearch,
  commands,
  topBarActions,
  children,
  ...userMenu
}: AppShellProps) => {
  const pathname = usePathname();
  const [collapsed, setCollapsed] = useState(false);
  const [mobileOpen, setMobileOpen] = useState(false);

  useEffect(() => {
    setCollapsed(readCollapsed());
  }, []);

  useEffect(() => {
    setMobileOpen(false);
  }, [pathname]);

  const changeCollapsed = (next: boolean) => {
    setCollapsed(next);
    try {
      localStorage.setItem(COLLAPSED_KEY, next ? "1" : "0");
    } catch {
      // Private mode or blocked storage: the preference just isn't remembered.
    }
  };

  const footer = (isCollapsed: boolean) => (
    <>
      {orgSwitcher?.(isCollapsed)}
      <UserCard collapsed={isCollapsed} {...userMenu} />
    </>
  );

  const sidebarProps = { nav, homeHref, product, primaryAction, footer };

  return (
    <TooltipProvider>
      <CommandPaletteProvider
        config={{ nav, groups: commands, onSearch, placeholder: searchPlaceholder }}
      >
        <div className="bg-background flex h-dvh overflow-hidden">
          <AppSidebar {...sidebarProps} collapsed={collapsed} onCollapsedChange={changeCollapsed} />

          <Sheet open={mobileOpen} onOpenChange={setMobileOpen}>
            <SheetContent side="left" className="bg-sidebar w-72 p-0 sm:max-w-72">
              <SheetTitle className="sr-only">Navigation</SheetTitle>
              <SheetDescription className="sr-only">Main navigation</SheetDescription>
              <AppSidebar {...sidebarProps} collapsed={false} variant="sheet" />
            </SheetContent>
          </Sheet>

          <div className="flex min-w-0 flex-1 flex-col">
            <TopBar
              nav={nav}
              overviewPaths={overviewPaths}
              greeting={greeting}
              searchPlaceholder={searchPlaceholder}
              actions={topBarActions}
              onOpenMenu={() => setMobileOpen(true)}
              userMenu={userMenu}
            />
            {/* A flex scroll container keeps its end padding once content overflows; a block one drops it. */}
            <main
              id="main"
              className="flex min-h-0 flex-1 flex-col overflow-y-auto overscroll-contain p-4 sm:p-6"
            >
              {children}
            </main>
          </div>
        </div>
      </CommandPaletteProvider>
    </TooltipProvider>
  );
};
