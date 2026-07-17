"use client";

import { AnimatePresence, Transition, motion } from "framer-motion";
import { ChevronLeft, ChevronRight } from "lucide-react";
import { usePathname, useRouter } from "next/navigation";
import { useCallback, useState } from "react";
import Link from "next/link";

import { ADMIN_ROUTES, USER_ROUTES, RouteConfig } from "@/config/routes";
import { cn, normalize, permissionResolver } from "@/lib";
import { useGlobalStore, useUserStore } from "@/store";
import { CompanySwitcher } from "./company-switcher";
import { ContextSwitcher } from "./context-switcher";
import { ScrollArea } from "./scroll-area";
import { Logo } from "./logo";

interface Props {
  context: "admin" | "ess";
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

export const Sidebar = ({ context }: Props) => {
  const { isCollapsed } = useGlobalStore();
  const { user } = useUserStore();
  const pathname = usePathname();
  const router = useRouter();

  const routes = context === "admin" ? ADMIN_ROUTES : USER_ROUTES;

  const {} = permissionResolver(user, [], []);

  const [prevIsCollapsed, setPrevIsCollapsed] = useState(isCollapsed);
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

  if (prevIsCollapsed !== isCollapsed) {
    setPrevIsCollapsed(isCollapsed);
    if (isCollapsed) setDrillRoute(null);
  }

  const drillIn = useCallback(
    (route: RouteConfig) => {
      if (!route.children?.length || isCollapsed) {
        router.push(route.href);
        return;
      }
      setNavDirection(1);
      setDrillRoute(route);
    },
    [router, isCollapsed],
  );

  const drillOut = useCallback(() => {
    setNavDirection(-1);
    setDrillRoute(null);
  }, []);

  const showDrill = !isCollapsed && !!drillRoute;

  return (
    <motion.aside className={cn("flex h-full flex-col border-r", isCollapsed ? "w-16" : "w-68")}>
      <motion.div className="flex h-16 items-center border-b px-4">
        <Logo />
      </motion.div>
      <CompanySwitcher />
      <hr />
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
                className="text-muted-foreground hover:text-foreground flex items-center gap-x-1 px-4 py-3 text-left text-sm font-medium"
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
                        pathname === drillRoute!.href ? "bg-black text-white" : undefined,
                      )}
                      href={drillRoute!.href}
                    >
                      Overview
                    </Link>
                  )}
                  {drillRoute!.children!.map((group) => (
                    <motion.div className="space-y-1" key={group.group}>
                      <p className="text-muted-foreground text-[10px] uppercase">{group.group}</p>
                      <motion.div className="space-y-1">
                        {group.routes.map((route) => {
                          const disabled = group.disabled || !!route.disabled;
                          const active =
                            pathname === route.href || pathname.startsWith(`${route.href}/`);
                          return (
                            <Link
                              className={cn(
                                "flex items-center gap-x-2 rounded-md px-3 py-2 text-left text-sm font-medium",
                                disabled
                                  ? "text-muted-foreground/50 pointer-events-none cursor-not-allowed"
                                  : active && "bg-black text-white",
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
              <ScrollArea className={cn("min-h-0 flex-1", isCollapsed ? "px-1.5 py-4" : "p-4")}>
                <motion.div className="space-y-2">
                  {routes.map((group) => (
                    <motion.div className="space-y-1" key={group.group}>
                      {!isCollapsed && (
                        <p className="text-muted-foreground text-[10px] uppercase">{group.group}</p>
                      )}
                      <motion.div className="space-y-1">
                        {group.routes.map((route) => {
                          const disabled = group.disabled || !!route.disabled;
                          const active = normalize(pathname) === route.href;
                          const hasChildren = !!route.children?.length;
                          const classes = cn(
                            "flex w-full items-center rounded-md text-left text-sm font-medium",
                            isCollapsed
                              ? "aspect-square w-full shrink-0 justify-center"
                              : "gap-x-2 px-3 py-2",
                            disabled
                              ? "text-muted-foreground/50 pointer-events-none cursor-not-allowed"
                              : active && "bg-black text-white",
                            hasChildren && !isCollapsed && "justify-between",
                          );

                          if (hasChildren) {
                            return (
                              <button
                                className={classes}
                                disabled={disabled}
                                key={route.href}
                                onClick={() => !disabled && drillIn(route)}
                                title={isCollapsed ? route.label : undefined}
                              >
                                <span
                                  className={cn("flex items-center", !isCollapsed && "gap-x-2")}
                                >
                                  {route.icon && <route.icon className="size-4" />}
                                  {!isCollapsed && route.label}
                                </span>
                                {!isCollapsed && <ChevronRight className="size-4 shrink-0" />}
                              </button>
                            );
                          }
                          return (
                            <Link
                              className={classes}
                              href={disabled ? "#" : route.href}
                              key={route.href}
                              title={isCollapsed ? route.label : undefined}
                            >
                              {route.icon && <route.icon className="size-4" />}
                              {!isCollapsed && route.label}
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
      <hr />
      <ContextSwitcher />
    </motion.aside>
  );
};
