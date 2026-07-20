"use client";

import React from "react";

import { ScrollArea } from "./scroll-area";
import { cn } from "../../lib";

interface Props {
  children: React.ReactNode;
  title: string;
  actions?: React.ReactNode[];
  permissions?: string[];
  subtitle?: string;
}

export const PageLayout = ({}: Props) => (
  <div className={cn("h-full w-full space-y-6")}>
    <div className="flex w-full items-center justify-between">
      <div className="space-y-1">
        <h2 className="text-xl">{}</h2>
        <p className="text-muted-foreground text-sm">{}</p>
      </div>
    </div>
    <ScrollArea className="min-h-0">
      <div></div>
    </ScrollArea>
  </div>
);
