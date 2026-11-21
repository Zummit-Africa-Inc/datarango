"use client";

import { Tabs as TabsPrimitive } from "radix-ui";
import * as React from "react";

import { cn } from "../../lib/utils";

type TabsVariant = "underline" | "pill";

const TabsVariantContext = React.createContext<TabsVariant>("underline");

/** Radix tabs with the two §5 looks: `underline` (page sections) and `pill` (filters, toggles). */
function Tabs({
  className,
  variant = "underline",
  ...props
}: React.ComponentProps<typeof TabsPrimitive.Root> & { variant?: TabsVariant }) {
  return (
    <TabsVariantContext.Provider value={variant}>
      <TabsPrimitive.Root
        data-slot="tabs"
        data-variant={variant}
        className={cn("flex flex-col gap-4", className)}
        {...props}
      />
    </TabsVariantContext.Provider>
  );
}

function TabsList({ className, ...props }: React.ComponentProps<typeof TabsPrimitive.List>) {
  const variant = React.useContext(TabsVariantContext);
  return (
    <TabsPrimitive.List
      data-slot="tabs-list"
      className={cn(
        "scrollbar-hide flex items-center overflow-x-auto",
        variant === "underline"
          ? "border-border gap-6 border-b"
          : "bg-muted w-fit gap-1 rounded-full p-1",
        className,
      )}
      {...props}
    />
  );
}

function TabsTrigger({ className, ...props }: React.ComponentProps<typeof TabsPrimitive.Trigger>) {
  const variant = React.useContext(TabsVariantContext);
  return (
    <TabsPrimitive.Trigger
      data-slot="tabs-trigger"
      className={cn(
        "group/tab focus-visible:ring-ring focus-visible:ring-offset-background inline-flex shrink-0 items-center gap-2 text-sm font-medium whitespace-nowrap transition-colors duration-150 ease-out outline-none focus-visible:ring-2 focus-visible:ring-offset-2 disabled:pointer-events-none disabled:opacity-50 [&_svg]:size-4 [&_svg]:shrink-0",
        variant === "underline"
          ? "text-foreground-muted hover:text-foreground data-[state=active]:text-foreground data-[state=active]:after:bg-primary relative -mb-px h-11 rounded-none after:absolute after:inset-x-0 after:bottom-0 after:h-0.5 after:rounded-full"
          : "text-foreground-muted hover:text-foreground data-[state=active]:bg-surface data-[state=active]:text-foreground h-9 rounded-full px-4 data-[state=active]:shadow-sm",
        className,
      )}
      {...props}
    />
  );
}

function TabsContent({ className, ...props }: React.ComponentProps<typeof TabsPrimitive.Content>) {
  return (
    <TabsPrimitive.Content
      data-slot="tabs-content"
      className={cn("outline-none", className)}
      {...props}
    />
  );
}

export { Tabs, TabsList, TabsTrigger, TabsContent };
