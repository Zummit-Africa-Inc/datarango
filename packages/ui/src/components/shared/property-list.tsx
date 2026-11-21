import type { LucideIcon } from "lucide-react";
import type { ReactNode } from "react";

import { cn } from "../../lib";

export interface PropertyItem {
  label: string;
  icon?: LucideIcon;
  value?: ReactNode;
}

/** Label-with-icon on the left, value on the right; missing values read "Empty". */
export const PropertyList = ({
  items,
  className,
}: {
  items: PropertyItem[];
  className?: string;
}) => (
  <dl className={cn("grid grid-cols-[minmax(8rem,auto)_1fr] gap-x-6 text-sm", className)}>
    {items.map(({ label, icon: Icon, value }) => {
      const empty = value === undefined || value === null || value === "";
      return (
        <div key={label} className="contents">
          <dt className="text-foreground-muted flex min-h-10 items-center gap-2">
            {Icon && <Icon aria-hidden="true" className="size-4 shrink-0" />}
            {label}
          </dt>
          <dd
            className={cn(
              "flex min-h-10 min-w-0 items-center",
              empty ? "text-foreground-subtle" : "text-foreground",
            )}
          >
            {empty ? "Empty" : value}
          </dd>
        </div>
      );
    })}
  </dl>
);
