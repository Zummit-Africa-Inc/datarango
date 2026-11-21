"use client";

import { ChevronDown, PanelLeftClose, PanelLeftOpen, Search, type LucideIcon } from "lucide-react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { useEffect, useState, type KeyboardEvent, type ReactNode } from "react";

import { findActiveHref, type NavGroup, type NavItem } from "../../../config/nav";
import { cn } from "../../../lib";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuTrigger,
} from "../../ui/dropdown-menu";
import { Tooltip, TooltipContent, TooltipTrigger } from "../../ui/tooltip";
import { Logo } from "../logo";
import { useCommandPalette } from "./command-palette";

export interface SidebarPrimaryAction {
  label: string;
  icon: LucideIcon;
  href?: string;
  /** Wraps the rendered button, e.g. as a dialog trigger. */
  wrap?: (button: ReactNode) => ReactNode;
}

export interface AppSidebarProps {
  nav: NavGroup[];
  homeHref: string;
  /** Product name beside the logo ("Studio", "Console", "Admin"). */
  product?: string;
  primaryAction?: SidebarPrimaryAction;
  /** Org switcher and user card, rendered at the bottom. Receive the collapsed state. */
  footer?: (collapsed: boolean) => ReactNode;
  collapsed: boolean;
  onCollapsedChange?: (collapsed: boolean) => void;
  /** Mobile sheet: always expanded, no collapse button. */
  variant?: "rail" | "sheet";
}

const itemClass =
  "focus-visible:ring-ring flex h-9 w-full items-center gap-3 rounded-sm px-3 text-sm font-medium outline-none transition-colors duration-150 ease-out focus-visible:ring-2 [&_svg]:size-[18px] [&_svg]:shrink-0";

const idleClass = "text-foreground-muted hover:bg-muted hover:text-foreground";
const activeClass = "bg-primary-soft text-primary-soft-foreground [&_svg]:text-primary";

/** Moves focus between sidebar items with the arrow keys (§10). */
const onNavKeyDown = (e: KeyboardEvent<HTMLElement>) => {
  if (!["ArrowDown", "ArrowUp", "Home", "End"].includes(e.key)) return;
  const items = Array.from(
    e.currentTarget.querySelectorAll<HTMLElement>("[data-nav-item]:not([aria-disabled=true])"),
  );
  const index = items.indexOf(document.activeElement as HTMLElement);
  if (index === -1) return;
  e.preventDefault();
  const next =
    e.key === "Home"
      ? 0
      : e.key === "End"
        ? items.length - 1
        : (index + (e.key === "ArrowDown" ? 1 : -1) + items.length) % items.length;
  items[next]?.focus();
};

const RailTooltip = ({ label, children }: { label: string; children: ReactNode }) => (
  <Tooltip>
    <TooltipTrigger asChild>{children}</TooltipTrigger>
    <TooltipContent side="right">{label}</TooltipContent>
  </Tooltip>
);

const LeafLink = ({
  item,
  active,
  collapsed,
  nested,
}: {
  item: NavItem;
  active: boolean;
  collapsed: boolean;
  nested?: boolean;
}) => {
  const Icon = item.icon;
  if (item.disabled) {
    const body = (
      <span
        data-nav-item
        aria-disabled="true"
        tabIndex={-1}
        className={cn(
          itemClass,
          "text-foreground-subtle cursor-not-allowed opacity-60",
          collapsed && "justify-center px-0",
        )}
      >
        {Icon && <Icon aria-hidden="true" />}
        {!collapsed && (
          <>
            <span className="truncate">{item.label}</span>
            <span className="text-foreground-subtle ml-auto text-[0.6875rem]">Soon</span>
          </>
        )}
      </span>
    );
    return collapsed ? <RailTooltip label={`${item.label} (soon)`}>{body}</RailTooltip> : body;
  }
  const link = (
    <Link
      data-nav-item
      href={item.href}
      aria-current={active ? "page" : undefined}
      aria-label={collapsed ? item.label : undefined}
      className={cn(
        itemClass,
        active ? activeClass : idleClass,
        collapsed && "justify-center px-0",
        nested && "h-8 pl-3",
      )}
    >
      {Icon && !nested && <Icon aria-hidden="true" />}
      {!collapsed && <span className="truncate">{item.label}</span>}
    </Link>
  );
  return collapsed ? <RailTooltip label={item.label}>{link}</RailTooltip> : link;
};

const ParentItem = ({
  item,
  activeHref,
  collapsed,
}: {
  item: NavItem;
  activeHref: string | null;
  collapsed: boolean;
}) => {
  const Icon = item.icon;
  const childActive = item.children!.some((c) => c.href === activeHref);
  const [open, setOpen] = useState(childActive);
  const [flyout, setFlyout] = useState(false);

  useEffect(() => {
    if (childActive) setOpen(true);
  }, [childActive]);

  if (collapsed) {
    return (
      <DropdownMenu open={flyout} onOpenChange={setFlyout} modal={false}>
        <DropdownMenuTrigger asChild>
          <button
            data-nav-item
            type="button"
            aria-label={item.label}
            onPointerEnter={() => setFlyout(true)}
            className={cn(
              itemClass,
              "justify-center px-0",
              childActive ? "text-primary bg-primary-soft" : idleClass,
            )}
          >
            {Icon && <Icon aria-hidden="true" />}
          </button>
        </DropdownMenuTrigger>
        <DropdownMenuContent
          side="right"
          align="start"
          sideOffset={8}
          className="min-w-48"
          onPointerLeave={() => setFlyout(false)}
        >
          <DropdownMenuLabel className="text-foreground-subtle text-xs font-medium tracking-[0.06em] uppercase">
            {item.label}
          </DropdownMenuLabel>
          {item.children!.map((child) => (
            <DropdownMenuItem
              key={child.href}
              asChild
              disabled={child.disabled}
              className={cn(child.href === activeHref && activeClass)}
            >
              <Link href={child.href}>{child.label}</Link>
            </DropdownMenuItem>
          ))}
        </DropdownMenuContent>
      </DropdownMenu>
    );
  }

  return (
    <div>
      <button
        data-nav-item
        type="button"
        aria-expanded={open}
        onClick={() => setOpen((prev) => !prev)}
        className={cn(itemClass, idleClass, childActive && "text-foreground [&_svg]:text-primary")}
      >
        {Icon && <Icon aria-hidden="true" />}
        <span className="truncate">{item.label}</span>
        <ChevronDown
          aria-hidden="true"
          className={cn(
            "text-foreground-subtle! ml-auto size-4! transition-transform duration-200 motion-reduce:transition-none",
            open && "rotate-180",
          )}
        />
      </button>
      {open && (
        <div className="border-border mt-0.5 ml-[21px] space-y-0.5 border-l pl-3">
          {item.children!.map((child) => (
            <LeafLink
              key={child.href}
              item={child}
              active={child.href === activeHref}
              collapsed={false}
              nested
            />
          ))}
        </div>
      )}
    </div>
  );
};

/** Collapsible app sidebar (§9): brand, quick search, primary action, nav groups, footer. */
export const AppSidebar = ({
  nav,
  homeHref,
  product,
  primaryAction,
  footer,
  collapsed,
  onCollapsedChange,
  variant = "rail",
}: AppSidebarProps) => {
  const pathname = usePathname();
  const palette = useCommandPalette();
  const activeHref = findActiveHref(nav, pathname);
  const isRail = variant === "rail";

  const ActionIcon = primaryAction?.icon;
  const actionClass =
    "bg-primary text-primary-foreground hover:bg-primary-hover focus-visible:ring-ring focus-visible:ring-offset-sidebar flex h-10 w-full items-center justify-center gap-2 rounded-md text-sm font-medium transition-colors duration-150 outline-none focus-visible:ring-2 focus-visible:ring-offset-2 active:scale-[0.98]";
  const actionContent = primaryAction && ActionIcon && (
    <>
      <ActionIcon aria-hidden="true" className="size-[18px]" />
      {!collapsed && primaryAction.label}
    </>
  );
  const actionLabel = collapsed ? primaryAction?.label : undefined;
  const actionNode = !primaryAction ? null : primaryAction.href ? (
    <Link href={primaryAction.href} aria-label={actionLabel} className={actionClass}>
      {actionContent}
    </Link>
  ) : (
    (primaryAction.wrap ?? ((node: ReactNode) => node))(
      <button type="button" aria-label={actionLabel} className={actionClass}>
        {actionContent}
      </button>,
    )
  );

  const searchButton = (
    <button
      type="button"
      onClick={palette.open}
      aria-label="Search"
      className={cn(
        itemClass,
        "border-border bg-surface text-foreground-subtle hover:border-border-strong hover:text-foreground-muted border",
        collapsed && "justify-center px-0",
      )}
    >
      <Search aria-hidden="true" />
      {!collapsed && (
        <>
          <span className="font-normal">Search</span>
          <kbd className="border-border text-foreground-subtle ml-auto rounded-xs border px-1.5 font-mono text-[0.6875rem]">
            /
          </kbd>
        </>
      )}
    </button>
  );

  return (
    <aside
      aria-label="Main"
      className={cn(
        "bg-sidebar text-foreground flex h-full shrink-0 flex-col",
        isRail &&
          "border-border hidden border-r transition-[width] duration-200 ease-out motion-reduce:transition-none lg:flex",
        isRail && (collapsed ? "w-[72px]" : "w-64"),
        !isRail && "w-full",
      )}
    >
      <div
        className={cn(
          "flex h-16 shrink-0 items-center gap-2",
          collapsed ? "justify-center px-3" : "justify-between px-4",
        )}
      >
        <Link
          href={homeHref}
          className="focus-visible:ring-ring flex min-w-0 items-center gap-2 rounded-sm outline-none focus-visible:ring-2"
          aria-label={product ? `Datarango ${product}, home` : "Datarango home"}
        >
          <Logo collapsed={collapsed} />
          {product && !collapsed && (
            <span className="font-display text-foreground-muted border-border border-l pl-2 text-sm font-semibold">
              {product}
            </span>
          )}
        </Link>
      </div>

      <div className={cn("space-y-2 pb-3", collapsed ? "px-3" : "px-4")}>
        {isRail && collapsed && (
          <RailTooltip label="Expand sidebar">
            <button
              type="button"
              aria-label="Expand sidebar"
              onClick={() => onCollapsedChange?.(false)}
              className={cn(itemClass, idleClass, "justify-center px-0")}
            >
              <PanelLeftOpen aria-hidden="true" />
            </button>
          </RailTooltip>
        )}
        {collapsed ? (
          <RailTooltip label="Search (/)">{searchButton}</RailTooltip>
        ) : (
          <div className="flex items-center gap-2">
            <div className="min-w-0 flex-1">{searchButton}</div>
            {isRail && !collapsed && (
              <RailTooltip label="Collapse sidebar">
                <button
                  type="button"
                  aria-label="Collapse sidebar"
                  onClick={() => onCollapsedChange?.(true)}
                  className="text-foreground-subtle hover:bg-muted hover:text-foreground focus-visible:ring-ring inline-flex size-9 shrink-0 items-center justify-center rounded-sm outline-none focus-visible:ring-2"
                >
                  <PanelLeftClose className="size-[18px]" />
                </button>
              </RailTooltip>
            )}
          </div>
        )}
        {actionNode &&
          (collapsed && primaryAction ? (
            <RailTooltip label={primaryAction.label}>
              <span className="block">{actionNode}</span>
            </RailTooltip>
          ) : (
            actionNode
          ))}
      </div>

      <nav
        aria-label="Primary"
        onKeyDown={onNavKeyDown}
        className={cn(
          "custom-scrollbar min-h-0 flex-1 space-y-5 overflow-y-auto py-2",
          collapsed ? "px-3" : "px-4",
        )}
      >
        {nav.map((group, gi) => (
          <div key={group.label ?? gi} className="space-y-0.5">
            {group.label && !collapsed && (
              <p className="text-foreground-subtle px-3 pb-1 text-xs font-medium tracking-[0.06em] uppercase">
                {group.label}
              </p>
            )}
            {group.items.map((item) =>
              item.children?.length ? (
                <ParentItem
                  key={item.href}
                  item={item}
                  activeHref={activeHref}
                  collapsed={collapsed}
                />
              ) : (
                <LeafLink
                  key={item.href}
                  item={item}
                  active={item.href === activeHref}
                  collapsed={collapsed}
                />
              ),
            )}
          </div>
        ))}
      </nav>

      {footer && (
        <div className={cn("border-border space-y-1 border-t py-3", collapsed ? "px-3" : "px-4")}>
          {footer(collapsed)}
        </div>
      )}
    </aside>
  );
};
