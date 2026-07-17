"use client";

import { ChevronsUpDown } from "lucide-react";

import { Popover, PopoverContent, PopoverTrigger } from "../ui/popover";
import { useGlobalStore, useUserStore } from "@/store";
import { Button } from "../ui/button";
import { cn } from "@/lib";

export const CompanySwitcher = () => {
  const { currentTenant, isCollapsed, onTenantChange } = useGlobalStore();
  const { tenants } = useUserStore();

  const triggerClasses = cn(
    "border-b",
    isCollapsed ? "size-11 justify-center p-0" : "h-11 w-full justify-between",
  );

  if (tenants.length <= 1) {
    return (
      <Button
        className={triggerClasses}
        title={isCollapsed ? currentTenant.name : undefined}
        variant="ghost"
      >
        <div className={cn("flex items-center", !isCollapsed && "gap-x-2")}>
          <div className="size-7 shrink-0 rounded bg-black"></div>
          {!isCollapsed && (
            <div className="text-left">
              <p className="text-sm font-medium">{currentTenant.name}</p>
              <p className="text-muted-foreground text-xs">{currentTenant.slug}</p>
            </div>
          )}
        </div>
      </Button>
    );
  }

  return (
    <Popover>
      <PopoverTrigger>
        <Button
          className={triggerClasses}
          title={isCollapsed ? currentTenant.name : undefined}
          variant="ghost"
        >
          <div className={cn("flex items-center", !isCollapsed && "gap-x-2")}>
            <div className="size-7 shrink-0 rounded bg-black"></div>
            {!isCollapsed && (
              <div className="text-left">
                <p className="text-sm font-medium">{currentTenant.name}</p>
                <p className="text-muted-foreground text-xs">{currentTenant.slug}</p>
              </div>
            )}
          </div>
          {!isCollapsed && <ChevronsUpDown className="size-4" />}
        </Button>
      </PopoverTrigger>
      <PopoverContent align={isCollapsed ? "start" : "center"} className="sm:max-w-64">
        {tenants.map((tenant) => (
          <div
            className="flex items-center gap-x-2 p-2"
            key={tenant.id}
            onClick={() => onTenantChange(tenant)}
          >
            <div className="size-8 rounded bg-black"></div>
            <div className="text-left">
              <p className="text-sm font-medium">{tenant.name}</p>
              <p className="text-muted-foreground text-xs">{tenant.slug}</p>
            </div>
          </div>
        ))}
      </PopoverContent>
    </Popover>
  );
};
