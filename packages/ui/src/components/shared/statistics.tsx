import { LucideIcon } from "lucide-react";

import { cn } from "../../lib";

interface Props {
  label: string;
  value: string;
  delta?: string;
  description?: string;
  icon?: LucideIcon;
}

/**
 * Stat card per DESIGN.md: caption-uppercase label, mono value, one delta
 * pill. Nothing else.
 */
export const Statistics = ({ label, value, delta, description, icon: Icon }: Props) => (
  <div className="bg-card border-hairline space-y-2 rounded-lg border p-4">
    <div className="flex items-center justify-between">
      <p className="caption-upper text-muted-foreground">{label}</p>
      {Icon && <Icon className="text-muted-foreground size-4" />}
    </div>
    <p className="mono-data text-ink text-2xl">{value}</p>
    <div className="flex items-center gap-x-2">
      {delta && (
        <span
          className={cn(
            "mono-data rounded-full px-2 py-0.5 text-xs",
            delta.startsWith("+") ? "bg-success-soft text-success" : "bg-error-soft text-error",
          )}
        >
          {delta}
        </span>
      )}
      {description && <p className="text-muted-foreground text-sm">{description}</p>}
    </div>
  </div>
);
