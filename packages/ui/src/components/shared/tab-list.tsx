"use client";

import { cn } from "../../lib";

interface Option {
  label: string;
  value: string;
  disabled?: boolean;
}

interface Props {
  activeTab: string;
  onTabChange: (tab: string) => void;
  tabs: Option[];
  tabButtonClassName?: string;
  tabListClassName?: string;
}

export const TabList = ({
  activeTab,
  onTabChange,
  tabs,
  tabButtonClassName,
  tabListClassName,
}: Props) => {
  return (
    <div
      className={cn("bg-muted inline-flex items-center gap-x-1 rounded-lg p-1", tabListClassName)}
    >
      {tabs.map((tab) => (
        <button
          className={cn(
            "rounded-md px-4 py-1 text-sm font-medium",
            activeTab === tab.value
              ? "bg-primary-500 text-white"
              : "hover:bg-muted-foreground/10 bg-transparent",
            tab.disabled && "cursor-not-allowed opacity-50",
            tabButtonClassName,
          )}
          disabled={tab.disabled}
          key={tab.value}
          onClick={() => onTabChange(tab.value)}
        >
          {tab.label}
        </button>
      ))}
    </div>
  );
};
