"use client";

import { Check } from "lucide-react";
import { useEffect, useState, type ReactNode } from "react";

import { ACCENT_CLASSES, type AccentToken } from "../../config/accents";
import { cn } from "../../lib";

const clamp = (value: number) => Math.min(100, Math.max(0, value));

const toneClass = (accent?: AccentToken) => (accent ? ACCENT_CLASSES[accent].text : "text-primary");

/** Animates from 0 to the target on mount; CSS drops the transition under reduced motion. */
const useMountedValue = (value: number) => {
  const [shown, setShown] = useState(0);
  useEffect(() => {
    const frame = requestAnimationFrame(() => setShown(value));
    return () => cancelAnimationFrame(frame);
  }, [value]);
  return shown;
};

export interface ProgressRingProps {
  value: number;
  size?: number;
  thickness?: number;
  accent?: AccentToken;
  label?: string;
  showValue?: boolean;
  className?: string;
  children?: ReactNode;
}

export const ProgressRing = ({
  value,
  size = 64,
  thickness = 6,
  accent,
  label = "Progress",
  showValue = true,
  className,
  children,
}: ProgressRingProps) => {
  const pct = clamp(value);
  const shown = useMountedValue(pct);
  const r = (size - thickness) / 2;
  const c = 2 * Math.PI * r;
  return (
    <div
      role="progressbar"
      aria-label={label}
      aria-valuemin={0}
      aria-valuemax={100}
      aria-valuenow={Math.round(pct)}
      className={cn("relative inline-flex shrink-0 items-center justify-center", className)}
      style={{ width: size, height: size }}
    >
      <svg width={size} height={size} className="-rotate-90" aria-hidden="true">
        <circle
          cx={size / 2}
          cy={size / 2}
          r={r}
          fill="none"
          strokeWidth={thickness}
          className="stroke-muted"
        />
        <circle
          cx={size / 2}
          cy={size / 2}
          r={r}
          fill="none"
          stroke="currentColor"
          strokeWidth={thickness}
          strokeLinecap="round"
          strokeDasharray={c}
          strokeDashoffset={c - (shown / 100) * c}
          className={cn(
            "transition-[stroke-dashoffset] duration-700 ease-out motion-reduce:transition-none",
            toneClass(accent),
          )}
        />
      </svg>
      <span className="font-display text-foreground absolute inset-0 flex items-center justify-center text-sm font-semibold tabular-nums">
        {children ?? (showValue ? `${Math.round(pct)}%` : null)}
      </span>
    </div>
  );
};

export interface ProgressBarProps {
  value: number;
  accent?: AccentToken;
  size?: "sm" | "md" | "lg";
  label?: string;
  showValue?: boolean;
  className?: string;
}

export const ProgressBar = ({
  value,
  accent,
  size = "md",
  label = "Progress",
  showValue = false,
  className,
}: ProgressBarProps) => {
  const pct = clamp(value);
  const shown = useMountedValue(pct);
  return (
    <div className={cn("flex items-center gap-3", className)}>
      <div
        role="progressbar"
        aria-label={label}
        aria-valuemin={0}
        aria-valuemax={100}
        aria-valuenow={Math.round(pct)}
        className={cn(
          "bg-muted relative w-full overflow-hidden rounded-full",
          size === "sm" ? "h-1.5" : size === "lg" ? "h-3" : "h-2",
        )}
      >
        <div
          className={cn(
            "h-full rounded-full bg-current transition-[width] duration-700 ease-out motion-reduce:transition-none",
            toneClass(accent),
          )}
          style={{ width: `${shown}%` }}
        />
      </div>
      {showValue && (
        <span className="text-foreground-muted w-10 shrink-0 text-right text-xs font-medium tabular-nums">
          {Math.round(pct)}%
        </span>
      )}
    </div>
  );
};

export interface SteppedProgressProps {
  value: number;
  steps?: { at: number; label: string }[];
  label?: string;
  className?: string;
}

const DEFAULT_STEPS = [
  { at: 25, label: "25%" },
  { at: 50, label: "50%" },
  { at: 75, label: "75%" },
  { at: 100, label: "Done" },
];

/** Milestone bar: a track with dots at each step; reached dots are filled and ticked. */
export const SteppedProgress = ({
  value,
  steps = DEFAULT_STEPS,
  label = "Milestones",
  className,
}: SteppedProgressProps) => {
  const pct = clamp(value);
  const shown = useMountedValue(pct);
  return (
    <div className={cn("w-full pt-1 pb-7", className)}>
      <div
        role="progressbar"
        aria-label={label}
        aria-valuemin={0}
        aria-valuemax={100}
        aria-valuenow={Math.round(pct)}
        aria-valuetext={`${Math.round(pct)}% complete`}
        className="bg-muted relative mx-2.5 h-1.5 rounded-full"
      >
        <div
          className="bg-primary h-full rounded-full transition-[width] duration-700 ease-out motion-reduce:transition-none"
          style={{ width: `${shown}%` }}
        />
        {steps.map((step) => {
          const reached = pct >= step.at;
          return (
            <div
              key={step.at}
              className="absolute top-1/2 flex -translate-x-1/2 -translate-y-1/2 flex-col items-center"
              style={{ left: `${step.at}%` }}
            >
              <span
                className={cn(
                  "flex size-5 items-center justify-center rounded-full border-2",
                  reached
                    ? "border-primary bg-primary text-primary-foreground"
                    : "border-border-strong bg-surface",
                )}
              >
                {reached && <Check aria-hidden="true" className="size-3" strokeWidth={3} />}
              </span>
              <span
                className={cn(
                  "absolute top-6 text-xs whitespace-nowrap",
                  reached ? "text-foreground font-medium" : "text-foreground-subtle",
                )}
              >
                {step.label}
              </span>
            </div>
          );
        })}
      </div>
    </div>
  );
};
