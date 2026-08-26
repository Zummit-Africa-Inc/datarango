"use client";

import React from "react";

import { cn } from "../../lib";

interface Props {
  children: React.ReactNode;
  /** Page heading. */
  title: string;
  /** Optional supporting line under the title. */
  subtitle?: string;
  /** Right-aligned header slots (buttons, filters, …), rendered in order. */
  actions?: React.ReactNode[];
  /** Extra classes for the page root. */
  className?: string;
}

/**
 * Presentational page shell: a title/subtitle header with a right-aligned actions
 * slot, above the page content. Scrolling + padding are owned by the app-shell
 * `<main>`, so this adds none. Access gating lives at the route.
 *
 * A column flex box that grows rather than `h-full`: height:100% pinned this to
 * the viewport and let long pages spill *out* of it, which put the overflow past
 * the scroller's bottom padding and pressed the last row against the window edge.
 * `flex-1` still fills the shell for short pages and for the ones that hand a
 * pane its own height (the lesson reader), but tall content now grows the box.
 */
export const PageLayout = ({ children, title, subtitle, actions, className }: Props) => (
  <div className={cn("flex w-full flex-1 flex-col space-y-6", className)}>
    <div className="flex w-full items-start justify-between gap-4">
      <div className="min-w-0 space-y-1">
        <h1 className="font-heading text-ink truncate text-xl">{title}</h1>
        {subtitle && <p className="text-muted-foreground text-sm">{subtitle}</p>}
      </div>
      {actions && actions.length > 0 && (
        <div className="flex shrink-0 items-center gap-2">
          {actions.map((action, i) => (
            <React.Fragment key={i}>{action}</React.Fragment>
          ))}
        </div>
      )}
    </div>
    {children}
  </div>
);
