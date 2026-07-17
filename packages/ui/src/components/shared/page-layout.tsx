"use client";

import React from "react";

import { ScrollArea } from "./scroll-area";
import { useRbac } from "@/hooks";
import { cn } from "@/lib";

interface Props {
  children: React.ReactNode;
  permissions: string[];
  title: string;
  className?: string;
  subtitle?: string;
}

export const PageLayout = ({ children, title, className, subtitle }: Props) => {
  const {} = useRbac();

  return (
    <div className={cn("h-full w-full space-y-6", className)}>
      <div className="flex w-full items-center justify-between">
        <div>
          <p className="text-xl font-medium">{title}</p>
          <p className="text-muted-foreground text-sm">{subtitle}</p>
        </div>
      </div>
      <ScrollArea className="min-h-0">{children}</ScrollArea>
    </div>
  );
};
