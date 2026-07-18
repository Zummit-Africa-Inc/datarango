"use client";

import { AnimatePresence, Transition, motion } from "framer-motion";
import { ChevronLeft, ChevronRight } from "lucide-react";
import { usePathname, useRouter } from "next/navigation";
import { type ReactNode, useCallback, useState } from "react";
import Link from "next/link";

import type { RouteConfig, RouteGroup } from "../../types";
import { cn, normalize } from "../../lib";
import { ScrollArea } from "./scroll-area";
import { Logo } from "./logo";

interface Props {
  /** Navigation groups — pre-filtered by the app for the user's permissions. */
  routes: RouteGroup[];
  collapsed?: boolean;
  /** Slot under the logo (e.g. <CompanySwitcher /> in console). */
  top?: ReactNode;
  /** Slot pinned to the bottom (e.g. <ContextSwitcher /> user block). */
  footer?: ReactNode;
  logoHref?: string;
}

const slideVariants = {
  enter: (direction: number) => ({
    x: direction > 0 ? "100%" : "-100%",
    opacity: 0,
  }),
  center: { x: 0, opacity: 1 },
  exit: (direction: number) => ({
    x: direction > 0 ? "-100%" : "100%",
    opacity: 0,
  }),
};

const slideTransition: Transition = { duration: 0.22, ease: "easeInOut" };

/** Active item: elevated ink fill + ember left-edge indicator (DESIGN.md). */
const activeClasses =
  "bg-ink-elevated text-on-ink before:absolute before:top-1/2 before:left-0 before:h-5 before:w-0.5 before:-translate-y-1/2 before:rounded-full before:bg-primary-400";

const itemBase = "relative text-on-ink-muted hover:text-on-ink";

/** The deep-ink app sidebar — the one institutional-dark element in the light app. */
export const Sidebar = ({ routes, collapsed = false, top, footer, logoHref = "/" }: Props) => {
  const pathname = usePathname();
  const router = useRouter();

  const [prevCollapsed, setPrevCollapsed] = useState(collapsed);
  const [navDirection, setNavDirection] = useState<1 | -1>(1);
  const [drillRoute, setDrillRoute] = useState<RouteConfig | null>(() => {
    const normalized = normalize(pathname);
    for (const group of routes) {
      for (const route of group.routes) {
        if (route.children?.length && normalized.startsWith(route.href)) {
          return route;
        }
      }
    }
    return null;
  });

  if (prevCollapsed !== collapsed) {
    setPrevCollapsed(collapsed);
    if (collapsed) setDrillRoute(null);
  }

  const drillIn = useCallback(
    (route: RouteConfig) => {
      if (!route.children?.length || collapsed) {
        router.push(route.href);
        return;
      }
      setNavDirection(1);
      setDrillRoute(route);
    },
    [router, collapsed],
  );

  const drillOut = useCallback(() => {
    setNavDirection(-1);
    setDrillRoute(null);
  }, []);

  const showDrill = !collapsed && !!drillRoute;

  return (
    <motion.aside
      className={cn(
        "bg-ink text-on-ink flex h-full flex-col border-r border-white/5",
        collapsed ? "w-16" : "w-60",
      )}
    >
      <motion.div className="flex h-16 items-center border-b border-white/5 px-4">
        <Link href={logoHref}>
          <Logo collapsed={collapsed} onInk />
        </Link>
      </motion.div>
      {top}
      <motion.div className="relative min-h-0 flex-1 overflow-hidden">
        <AnimatePresence custom={navDirection} initial={false} mode="wait">
          {showDrill ? (
            <motion.div
              key={drillRoute!.href}
              custom={navDirection}
              variants={slideVariants}
              initial="enter"
              animate="center"
              exit="exit"
              transition={slideTransition}
              className="absolute inset-0 flex flex-col"
            >
              <button
                className="text-on-ink-muted hover:text-on-ink flex items-center gap-x-1 px-4 py-3 text-left text-sm font-medium"
                onClick={drillOut}
              >
                <ChevronLeft className="size-4" />
                {drillRoute!.label}
              </button>
              <ScrollArea className="min-h-0 flex-1 p-4">
                <motion.div className="space-y-4">
                  {drillRoute!.hasOverview && (
                    <Link
                      className={cn(
                        "flex items-center gap-x-2 rounded-md px-3 py-2 text-left text-sm font-medium",
                        itemBase,
                        pathname === drillRoute!.href && activeClasses,
                      )}
                      href={drillRoute!.href}
                    >
                      Overview
                    </Link>
                  )}
                  {drillRoute!.children!.map((group) => (
                    <motion.div className="space-y-1" key={group.group}>
                      <p className="text-on-ink-muted/70 text-[10px] uppercase">{group.group}</p>
                      <motion.div className="space-y-1">
                        {group.routes.map((route) => {
                          const disabled = group.disabled || !!route.disabled;
                          const active =
                            pathname === route.href || pathname.startsWith(`${route.href}/`);
                          return (
                            <Link
                              className={cn(
                                "flex items-center gap-x-2 rounded-md px-3 py-2 text-left text-sm font-medium",
                                itemBase,
                                disabled
                                  ? "text-on-ink-muted/40 pointer-events-none cursor-not-allowed"
                                  : active && activeClasses,
                              )}
                              href={disabled ? "#" : route.href}
                              key={route.href}
                            >
                              {route.icon && <route.icon className="size-4" />}
                              {route.label}
                            </Link>
                          );
                        })}
                      </motion.div>
                    </motion.div>
                  ))}
                </motion.div>
              </ScrollArea>
            </motion.div>
          ) : (
            <motion.div
              key="main-nav"
              custom={navDirection}
              variants={slideVariants}
              initial="enter"
              animate="center"
              exit="exit"
              transition={slideTransition}
              className="absolute inset-0 flex flex-col"
            >
              <ScrollArea className={cn("min-h-0 flex-1", collapsed ? "px-1.5 py-4" : "p-4")}>
                <motion.div className="space-y-2">
                  {routes.map((group) => (
                    <motion.div className="space-y-1" key={group.group}>
                      {!collapsed && (
                        <p className="text-on-ink-muted/70 text-[10px] uppercase">{group.group}</p>
                      )}
                      <motion.div className="space-y-1">
                        {group.routes.map((route) => {
                          const disabled = group.disabled || !!route.disabled;
                          const active = normalize(pathname) === route.href;
                          const hasChildren = !!route.children?.length;
                          const classes = cn(
                            "flex w-full items-center rounded-md text-left text-sm font-medium",
                            itemBase,
                            collapsed
                              ? "aspect-square w-full shrink-0 justify-center"
                              : "gap-x-2 px-3 py-2",
                            disabled
                              ? "text-on-ink-muted/40 pointer-events-none cursor-not-allowed"
                              : active && activeClasses,
                            hasChildren && !collapsed && "justify-between",
                          );

                          if (hasChildren) {
                            return (
                              <button
                                className={classes}
                                disabled={disabled}
                                key={route.href}
                                onClick={() => !disabled && drillIn(route)}
                                title={collapsed ? route.label : undefined}
                              >
                                <span className={cn("flex items-center", !collapsed && "gap-x-2")}>
                                  {route.icon && <route.icon className="size-4" />}
                                  {!collapsed && route.label}
                                </span>
                                {!collapsed && <ChevronRight className="size-4 shrink-0" />}
                              </button>
                            );
                          }
                          return (
                            <Link
                              className={classes}
                              href={disabled ? "#" : route.href}
                              key={route.href}
                              title={collapsed ? route.label : undefined}
                            >
                              {route.icon && <route.icon className="size-4" />}
                              {!collapsed && route.label}
                            </Link>
                          );
                        })}
                      </motion.div>
                    </motion.div>
                  ))}
                </motion.div>
              </ScrollArea>
            </motion.div>
          )}
        </AnimatePresence>
      </motion.div>
      {footer && (
        <>
          <hr className="border-white/5" />
          {footer}
        </>
      )}
    </motion.aside>
  );
};
