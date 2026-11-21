"use client";

import { Check, ChevronsUpDown } from "lucide-react";

import { ACCENT_CLASSES, accentFromKey } from "../../../config/accents";
import { cn } from "../../../lib";
import type { Tenant } from "../../../types";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuTrigger,
} from "../../ui/dropdown-menu";

const TenantMark = ({ tenant }: { tenant: Tenant }) => (
  <span
    aria-hidden="true"
    className={cn(
      "font-display grid size-8 shrink-0 place-items-center rounded-sm text-sm font-semibold",
      ACCENT_CLASSES[accentFromKey(tenant.id)].tile,
    )}
  >
    {tenant.name.charAt(0).toUpperCase()}
  </span>
);

export interface OrgSwitcherProps {
  current: Tenant;
  tenants: Tenant[];
  onChange: (tenant: Tenant) => void;
  collapsed?: boolean;
}

/** Org switcher for the sidebar footer (B2B). A single org renders as a plain label. */
export const OrgSwitcher = ({ current, tenants, onChange, collapsed }: OrgSwitcherProps) => {
  const body = (
    <>
      <TenantMark tenant={current} />
      {!collapsed && (
        <span className="min-w-0 flex-1 text-left">
          <span className="text-foreground block truncate text-sm font-medium">{current.name}</span>
          <span className="text-foreground-muted block truncate text-xs">Organisation</span>
        </span>
      )}
    </>
  );
  const base = cn(
    "flex w-full items-center gap-3 rounded-sm outline-none",
    collapsed ? "justify-center p-1.5" : "p-2",
  );

  if (tenants.length <= 1) {
    return (
      <div className={base} title={collapsed ? current.name : undefined}>
        {body}
      </div>
    );
  }

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <button
          type="button"
          aria-label={`Switch organisation, current: ${current.name}`}
          className={cn(
            base,
            "hover:bg-muted focus-visible:ring-ring data-[state=open]:bg-muted focus-visible:ring-2",
          )}
        >
          {body}
          {!collapsed && (
            <ChevronsUpDown aria-hidden="true" className="text-foreground-subtle size-4 shrink-0" />
          )}
        </button>
      </DropdownMenuTrigger>
      <DropdownMenuContent side="top" align="start" className="w-60">
        <DropdownMenuLabel className="text-foreground-subtle text-xs font-medium tracking-[0.06em] uppercase">
          Organisations
        </DropdownMenuLabel>
        {tenants.map((tenant) => (
          <DropdownMenuItem key={tenant.id} onSelect={() => onChange(tenant)} className="gap-3">
            <TenantMark tenant={tenant} />
            <span className="min-w-0 flex-1 truncate">{tenant.name}</span>
            {tenant.id === current.id && <Check className="text-primary" />}
          </DropdownMenuItem>
        ))}
      </DropdownMenuContent>
    </DropdownMenu>
  );
};
