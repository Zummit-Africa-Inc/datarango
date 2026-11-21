import type { LucideIcon } from "lucide-react";
import type { ReactNode } from "react";

import { ACCENT_CLASSES, type AccentToken } from "../../config/accents";
import { cn } from "../../lib";

export interface EmptyStateProps {
  icon: LucideIcon;
  title: string;
  hint?: string;
  action?: ReactNode;
  accent?: AccentToken;
  className?: string;
}

/** Icon in a soft accent circle, one-line title, one-line hint, one action. No illustrations. */
export const EmptyState = ({
  icon: Icon,
  title,
  hint,
  action,
  accent = "violet",
  className,
}: EmptyStateProps) => (
  <div
    className={cn(
      "flex flex-col items-center justify-center gap-3 px-6 py-12 text-center",
      className,
    )}
  >
    <span
      className={cn(
        "mb-1 inline-flex size-14 items-center justify-center rounded-full",
        ACCENT_CLASSES[accent].soft,
      )}
    >
      <Icon aria-hidden="true" className="size-6" />
    </span>
    <p className="font-display text-foreground text-base font-semibold">{title}</p>
    {hint && <p className="text-foreground-muted max-w-sm text-sm">{hint}</p>}
    {action && <div className="mt-2">{action}</div>}
  </div>
);
