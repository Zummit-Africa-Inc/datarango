"use client";

import { ChevronsUpDown } from "lucide-react";

import { Popover, PopoverContent, PopoverTrigger } from "../ui/popover";
import type { Tenant } from "../../types";
import { Button } from "../ui/button";
import { cn } from "../../lib";

interface Props {
  currentTenant: Tenant;
  tenants: Tenant[];
  onTenantChange: (tenant: Tenant) => void;
  collapsed?: boolean;
}

const TenantMark = ({ tenant, onInk }: { tenant: Tenant; onInk?: boolean }) => (
  <div
    className={cn(
      "grid size-7 shrink-0 place-items-center rounded-xs text-xs font-semibold",
      onInk ? "bg-ink-elevated text-on-ink" : "bg-surface-strong text-foreground",
    )}
  >
    {tenant.name.charAt(0).toUpperCase()}
  </div>
);

/** Org/tenant switcher for multi-org members — lives in the ink sidebar. */
export const CompanySwitcher = ({ currentTenant, tenants, onTenantChange, collapsed }: Props) => {
  const triggerClasses = cn(
    "border-b border-white/5 rounded-none text-on-ink hover:bg-white/10 hover:text-on-ink",
    collapsed ? "size-11 justify-center p-0" : "h-11 w-full justify-between",
  );

  const trigger = (
    <div className={cn("flex items-center", !collapsed && "gap-x-2")}>
      <TenantMark onInk tenant={currentTenant} />
      {!collapsed && (
        <div className="text-left">
          <p className="text-on-ink text-sm font-medium">{currentTenant.name}</p>
          <p className="text-on-ink-muted text-xs">{currentTenant.slug}</p>
        </div>
      )}
    </div>
  );

  if (tenants.length <= 1) {
    return (
      <Button
        className={triggerClasses}
        title={collapsed ? currentTenant.name : undefined}
        variant="ghost"
      >
        {trigger}
      </Button>
    );
  }

  return (
    <Popover>
      <PopoverTrigger asChild>
        <Button
          className={triggerClasses}
          title={collapsed ? currentTenant.name : undefined}
          variant="ghost"
        >
          {trigger}
          {!collapsed && <ChevronsUpDown className="size-4" />}
        </Button>
      </PopoverTrigger>
      <PopoverContent align={collapsed ? "start" : "center"} className="p-1 sm:max-w-64">
        {tenants.map((tenant) => (
          <button
            className="hover:bg-surface-strong flex w-full items-center gap-x-2 rounded-xs p-2 transition-colors"
            key={tenant.id}
            onClick={() => onTenantChange(tenant)}
            type="button"
          >
            <TenantMark tenant={tenant} />
            <div className="text-left">
              <p className="text-sm font-medium">{tenant.name}</p>
              <p className="text-muted-foreground text-xs">{tenant.slug}</p>
            </div>
          </button>
        ))}
      </PopoverContent>
    </Popover>
  );
};
