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
      role="tablist"
      className={cn("bg-muted inline-flex items-center gap-x-1 rounded-full p-1", tabListClassName)}
    >
      {tabs.map((tab) => (
        <button
          type="button"
          role="tab"
          aria-selected={activeTab === tab.value}
          className={cn(
            "focus-visible:ring-ring h-9 rounded-full px-4 text-sm font-medium transition-colors duration-150 ease-out outline-none focus-visible:ring-2",
            activeTab === tab.value
              ? "bg-surface text-foreground shadow-sm"
              : "text-foreground-muted hover:text-foreground bg-transparent",
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
