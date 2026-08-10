"use client";

import { usePathname } from "next/navigation";
import { PanelLeft } from "lucide-react";
import type { ReactNode } from "react";

import { buildBreadcrumbs } from "../../lib";
import { Breadcrumb } from "./bread-crumb";
import { Input } from "../ui/input";

interface Props {
  onToggleSidebar?: () => void;
  /** Pathnames that show the greeting instead of breadcrumbs (app roots). */
  overviewPaths?: string[];
  greeting?: { title: string; subtitle?: string };
  search?: {
    value: string;
    onChange: (value: string) => void;
    placeholder?: string;
    /**
     * Runs on Enter. Optional because some shells filter as you type; when it
     * is supplied the box becomes a real form, so Enter submits and the browser
     * gives the input its usual search-field affordances.
     */
    onSubmit?: () => void;
  };
  /** Right-aligned slot (notifications bell, theme toggle, …). */
  actions?: ReactNode;
}

export const Header = ({
  onToggleSidebar,
  overviewPaths = ["/"],
  greeting,
  search,
  actions,
}: Props) => {
  const pathname = usePathname();

  const breadcrumbs = buildBreadcrumbs(pathname);
  const isOverview = overviewPaths.includes(pathname);

  return (
    <header className="flex h-16 w-full items-center justify-between border-b px-4">
      <div className="flex items-center gap-x-4">
        {onToggleSidebar && (
          <button onClick={onToggleSidebar} aria-label="Toggle sidebar">
            <PanelLeft className="size-4" />
          </button>
        )}
        {isOverview && greeting ? (
          <div>
            <p className="font-heading text-ink text-lg">{greeting.title}</p>
            {greeting.subtitle && (
              <p className="text-muted-foreground text-xs">{greeting.subtitle}</p>
            )}
          </div>
        ) : (
          <Breadcrumb items={breadcrumbs} />
        )}
      </div>
      <div className="flex items-center gap-x-4">
        {search && (
          <form
            role="search"
            onSubmit={(e) => {
              e.preventDefault();
              search.onSubmit?.();
            }}
          >
            <Input
              aria-label={search.placeholder ?? "Search"}
              className="w-80"
              onChange={(e) => search.onChange(e.target.value)}
              placeholder={search.placeholder ?? "Search…"}
              type="search"
              value={search.value}
            />
          </form>
        )}
        {actions}
      </div>
    </header>
  );
};
