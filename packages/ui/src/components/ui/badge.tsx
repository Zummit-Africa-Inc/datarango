import { Slot } from "radix-ui";
import * as React from "react";

import type { AccentToken } from "../../config/accents";
import { cn } from "../../lib/utils";

export type BadgeTone =
  "neutral" | "primary" | "success" | "warning" | "danger" | "info" | AccentToken;

export type BadgeAppearance = "solid" | "soft" | "outline";

type LegacyVariant =
  "default" | "secondary" | "destructive" | "success" | "warning" | "outline" | "ghost" | "link";

const TONES: Record<BadgeTone, Record<BadgeAppearance, string>> = {
  neutral: {
    solid: "bg-foreground text-background",
    soft: "bg-muted text-foreground-muted",
    outline: "border-border-strong text-foreground-muted",
  },
  primary: {
    solid: "bg-primary text-primary-foreground",
    soft: "bg-primary-soft text-primary-soft-foreground",
    outline: "border-primary/40 text-primary",
  },
  success: {
    solid: "bg-success-solid text-white",
    soft: "bg-success-soft text-success",
    outline: "border-success/40 text-success",
  },
  warning: {
    solid: "bg-warning-solid text-white",
    soft: "bg-warning-soft text-warning",
    outline: "border-warning/40 text-warning",
  },
  danger: {
    solid: "bg-danger-solid text-white",
    soft: "bg-danger-soft text-danger",
    outline: "border-danger/40 text-danger",
  },
  info: {
    solid: "bg-info-solid text-white",
    soft: "bg-info-soft text-info",
    outline: "border-info/40 text-info",
  },
  violet: {
    solid: "bg-violet-solid text-white",
    soft: "bg-violet-soft text-violet-soft-foreground",
    outline: "border-violet-soft-foreground/40 text-violet-soft-foreground",
  },
  lime: {
    solid: "bg-lime-solid text-lime-tile-foreground",
    soft: "bg-lime-soft text-lime-soft-foreground",
    outline: "border-lime-soft-foreground/40 text-lime-soft-foreground",
  },
  amber: {
    solid: "bg-amber-solid text-amber-tile-foreground",
    soft: "bg-amber-soft text-amber-soft-foreground",
    outline: "border-amber-soft-foreground/40 text-amber-soft-foreground",
  },
  sky: {
    solid: "bg-sky-solid text-white",
    soft: "bg-sky-soft text-sky-soft-foreground",
    outline: "border-sky-soft-foreground/40 text-sky-soft-foreground",
  },
  rose: {
    solid: "bg-rose-solid text-white",
    soft: "bg-rose-soft text-rose-soft-foreground",
    outline: "border-rose-soft-foreground/40 text-rose-soft-foreground",
  },
  teal: {
    solid: "bg-teal-solid text-white",
    soft: "bg-teal-soft text-teal-soft-foreground",
    outline: "border-teal-soft-foreground/40 text-teal-soft-foreground",
  },
};

const LEGACY: Record<LegacyVariant, [BadgeTone, BadgeAppearance]> = {
  default: ["primary", "solid"],
  secondary: ["neutral", "soft"],
  destructive: ["danger", "soft"],
  success: ["success", "soft"],
  warning: ["warning", "soft"],
  outline: ["neutral", "outline"],
  ghost: ["neutral", "soft"],
  link: ["primary", "soft"],
};

const SIZES = {
  default: "h-6 px-2 text-xs",
  sm: "h-5 px-1.5 text-[0.6875rem]",
  md: "h-7 px-2.5 text-[0.8125rem]",
  lg: "h-8 px-3 text-sm",
} as const;

/** Class string for a badge, for places that style a non-`Badge` element as one. */
const badgeVariants = ({
  tone = "neutral",
  appearance = "soft",
  size = "default",
}: {
  tone?: BadgeTone;
  appearance?: BadgeAppearance;
  size?: keyof typeof SIZES;
} = {}) =>
  cn(
    "group/badge focus-visible:ring-ring inline-flex w-fit shrink-0 items-center justify-center gap-1 overflow-hidden rounded-full border border-transparent font-medium whitespace-nowrap focus-visible:ring-2 has-data-[icon=inline-end]:pr-1.5 has-data-[icon=inline-start]:pl-1.5 [&>svg]:pointer-events-none [&>svg]:size-3",
    SIZES[size],
    TONES[tone][appearance],
  );

function Badge({
  className,
  tone,
  appearance,
  variant,
  size = "default",
  asChild = false,
  ...props
}: React.ComponentProps<"span"> & {
  tone?: BadgeTone;
  appearance?: BadgeAppearance;
  /** v1.1 API, kept until the purge phase. Prefer `tone` + `appearance`. */
  variant?: LegacyVariant | null;
  size?: keyof typeof SIZES | null;
  asChild?: boolean;
}) {
  const Comp = asChild ? Slot.Root : "span";
  const [legacyTone, legacyAppearance] = variant ? LEGACY[variant] : [];
  const resolvedTone = tone ?? legacyTone ?? "neutral";
  const resolvedAppearance = appearance ?? legacyAppearance ?? "soft";

  return (
    <Comp
      data-slot="badge"
      data-tone={resolvedTone}
      className={cn(
        badgeVariants({
          tone: resolvedTone,
          appearance: resolvedAppearance,
          size: size ?? "default",
        }),
        className,
      )}
      {...props}
    />
  );
}

/** Small count pill used next to tab and filter labels ("All courses 28"). */
function Count({ className, ...props }: React.ComponentProps<"span">) {
  return (
    <span
      data-slot="count"
      className={cn(
        "bg-muted text-foreground-muted group-data-[state=active]/tab:bg-primary-soft group-data-[state=active]/tab:text-primary-soft-foreground inline-flex h-5 min-w-5 items-center justify-center rounded-full px-1.5 font-mono text-[0.6875rem] tabular-nums",
        className,
      )}
      {...props}
    />
  );
}

export { Badge, Count, badgeVariants };
