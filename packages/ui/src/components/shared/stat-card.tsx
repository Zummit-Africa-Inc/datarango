import type { LucideIcon } from "lucide-react";
import { ArrowDownRight, ArrowUpRight, Minus } from "lucide-react";
import { useId } from "react";

import { ACCENT_CLASSES, type AccentToken } from "../../config/accents";
import { cn } from "../../lib";

export type DeltaDirection = "up" | "down" | "flat";

const directionOf = (delta: string): DeltaDirection => {
  const trimmed = delta.trim();
  if (trimmed.startsWith("+")) return "up";
  if (trimmed.startsWith("-") || trimmed.startsWith("−")) return "down";
  return "flat";
};

/** Change chip with an arrow, so the direction never relies on colour alone. */
export const Delta = ({
  value,
  direction,
  positiveIsGood = true,
  className,
}: {
  value: string;
  direction?: DeltaDirection;
  positiveIsGood?: boolean;
  className?: string;
}) => {
  const dir = direction ?? directionOf(value);
  const good = dir === "flat" ? null : (dir === "up") === positiveIsGood;
  const Icon = dir === "up" ? ArrowUpRight : dir === "down" ? ArrowDownRight : Minus;
  return (
    <span
      className={cn(
        "inline-flex h-6 items-center gap-0.5 rounded-full px-2 text-xs font-medium tabular-nums",
        good === null
          ? "bg-muted text-foreground-muted"
          : good
            ? "bg-success-soft text-success"
            : "bg-danger-soft text-danger",
        className,
      )}
    >
      <Icon aria-hidden="true" className="size-3.5" />
      {value}
    </span>
  );
};

/** Tiny trend line; decorative, so the figures it shows must also appear as text nearby. */
export const Sparkline = ({
  values,
  className,
  accent,
}: {
  values: number[];
  className?: string;
  accent?: AccentToken;
}) => {
  const id = useId();
  if (values.length < 2) return null;
  const max = Math.max(...values);
  const min = Math.min(...values);
  const span = max - min || 1;
  const line = values
    .map((v, i) => `${(i / (values.length - 1)) * 100},${28 - ((v - min) / span) * 24}`)
    .join(" ");
  return (
    <svg
      aria-hidden="true"
      viewBox="0 0 100 32"
      preserveAspectRatio="none"
      className={cn(
        "h-8 w-24 overflow-visible",
        accent ? ACCENT_CLASSES[accent].text : "text-primary",
        className,
      )}
    >
      <defs>
        <linearGradient id={id} x1="0" x2="0" y1="0" y2="1">
          <stop offset="0%" stopColor="currentColor" stopOpacity="0.25" />
          <stop offset="100%" stopColor="currentColor" stopOpacity="0" />
        </linearGradient>
      </defs>
      <polygon points={`0,32 ${line} 100,32`} fill={`url(#${id})`} />
      <polyline
        points={line}
        fill="none"
        stroke="currentColor"
        strokeWidth="2"
        strokeLinejoin="round"
        strokeLinecap="round"
        vectorEffect="non-scaling-stroke"
      />
    </svg>
  );
};

export interface StatCardProps {
  label: string;
  value: string | number;
  delta?: string;
  positiveIsGood?: boolean;
  hint?: string;
  icon?: LucideIcon;
  accent?: AccentToken;
  sparkline?: number[];
  className?: string;
}

/** Label, big tabular number, delta chip, optional icon tile and sparkline (§5). */
export const StatCard = ({
  label,
  value,
  delta,
  positiveIsGood,
  hint,
  icon: Icon,
  accent,
  sparkline,
  className,
}: StatCardProps) => (
  <div
    className={cn(
      "bg-card border-border flex flex-col gap-3 rounded-md border p-5 text-sm",
      className,
    )}
  >
    <div className="flex items-start justify-between gap-3">
      <p className="text-foreground-muted text-[0.8125rem] font-medium">{label}</p>
      {Icon && (
        <span
          className={cn(
            "inline-flex size-9 shrink-0 items-center justify-center rounded-sm",
            accent ? ACCENT_CLASSES[accent].soft : "bg-primary-soft text-primary-soft-foreground",
          )}
        >
          <Icon aria-hidden="true" className="size-[18px]" />
        </span>
      )}
    </div>
    <div className="flex items-end justify-between gap-3">
      <p className="font-display text-foreground text-[2rem] leading-[1.1] font-semibold tracking-[-0.02em] tabular-nums">
        {value}
      </p>
      {sparkline && <Sparkline values={sparkline} accent={accent} />}
    </div>
    {(delta || hint) && (
      <div className="flex flex-wrap items-center gap-2">
        {delta && <Delta value={delta} positiveIsGood={positiveIsGood} />}
        {hint && <p className="text-foreground-muted text-[0.8125rem]">{hint}</p>}
      </div>
    )}
  </div>
);
