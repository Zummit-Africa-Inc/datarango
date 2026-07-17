"use client";

import { usePathname } from "next/navigation";
import { PanelLeft } from "lucide-react";

import { buildBreadcrumbs, useApiQuery } from "@/lib";
import { Breadcrumb } from "./bread-crumb";
import { useParamsHandler } from "@/hooks";
import { useGlobalStore } from "@/store";
import { Input } from "../ui/input";

export const Header = () => {
  const { onParamsChange, params } = useParamsHandler({ query: "" });
  const { onCollapseChange } = useGlobalStore();
  const pathname = usePathname();

  const {} = useApiQuery({ endpoint: "/global/search", params });

  const breadcrumbs = buildBreadcrumbs(pathname);
  const isOverview = pathname === "/admin" || pathname === "/ess";

  return (
    <header className="flex h-16 w-full items-center justify-between border-b px-4">
      <div className="flex items-center gap-x-4">
        <button onClick={onCollapseChange}>
          <PanelLeft className="size-4" />
        </button>
        {isOverview ? (
          <div className="">
            <p className="text-sm font-medium">User</p>
            <p className="text-muted-foreground text-xs">Let&apos;s get started</p>
          </div>
        ) : (
          <Breadcrumb items={breadcrumbs} />
        )}
      </div>
      <div className="flex items-center gap-x-4">
        <Input
          className="w-64"
          onChange={(e) => onParamsChange("query", e.target.value)}
          type="search"
          value={params.query}
        />
      </div>
    </header>
  );
};
