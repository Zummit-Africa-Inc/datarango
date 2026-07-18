"use client";

import React from "react";

import { ScrollArea } from "./scroll-area";
import { cn } from "../../lib";

interface Props {
  children: React.ReactNode;
  title: string;
  className?: string;
  subtitle?: string;
  /** Right-aligned header slot (primary action button, filters, …). */
  actions?: React.ReactNode;
}

export const PageLayout = ({ children, title, className, subtitle, actions }: Props) => (
  <div className={cn("h-full w-full space-y-6", className)}>
    <div className="flex w-full items-center justify-between">
      <div>
        <p className="font-heading text-xl font-semibold">{title}</p>
        {subtitle && <p className="text-muted-foreground text-sm">{subtitle}</p>}
      </div>
      {actions}
    </div>
    <ScrollArea className="min-h-0">{children}</ScrollArea>
  </div>
);
