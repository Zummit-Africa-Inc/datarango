import type { SVGProps } from "react";

import { ACCENT_CLASSES, type AccentToken } from "../../config/accents";
import { cn } from "../../lib";

export type ShapeAccent = AccentToken | "primary";

export interface ShapeProps extends Omit<SVGProps<SVGSVGElement>, "children"> {
  accent?: ShapeAccent;
  size?: number | string;
  tone?: "shape" | "solid";
}

const toneClass = (accent: ShapeAccent, tone: "shape" | "solid") => {
  if (accent === "primary")
    return tone === "solid" ? "text-primary" : "text-ember-300 dark:text-ember-800";
  return tone === "solid" ? ACCENT_CLASSES[accent].text : ACCENT_CLASSES[accent].shape;
};

const Shape = ({
  accent = "violet",
  size = 96,
  tone = "shape",
  className,
  viewBox,
  children,
  ...props
}: ShapeProps & { viewBox: string; children: React.ReactNode }) => (
  <svg
    aria-hidden="true"
    focusable="false"
    viewBox={viewBox}
    width={size}
    height={size}
    className={cn("pointer-events-none shrink-0 select-none", toneClass(accent, tone), className)}
    {...props}
  >
    {children}
  </svg>
);

export const Blob = (props: ShapeProps) => (
  <Shape viewBox="0 0 200 200" {...props}>
    <path
      fill="currentColor"
      d="M44.7 -58.1C57.4 -48.6 66.6 -34.4 70.9 -18.6C75.2 -2.8 74.6 14.6 67.4 28.7C60.2 42.8 46.4 53.6 31.1 61.5C15.8 69.4 -1 74.4 -18.1 71.8C-35.2 69.2 -52.6 59 -63.3 44.1C-74 29.2 -78 9.6 -74.4 -8.2C-70.8 -26 -59.6 -42 -45.3 -51.4C-31 -60.8 -15.5 -63.6 0.6 -64.4C16.7 -65.2 32 -67.6 44.7 -58.1Z"
      transform="translate(100 100)"
    />
  </Shape>
);

export const Circle = (props: ShapeProps) => (
  <Shape viewBox="0 0 100 100" {...props}>
    <circle cx="50" cy="50" r="50" fill="currentColor" />
  </Shape>
);

export const HalfMoon = (props: ShapeProps) => (
  <Shape viewBox="0 0 100 100" {...props}>
    <path fill="currentColor" d="M0 50a50 50 0 0 1 100 0Z" transform="translate(0 25)" />
  </Shape>
);

export const Ring = ({ strokeWidth = 14, ...props }: ShapeProps & { strokeWidth?: number }) => (
  <Shape viewBox="0 0 100 100" {...props}>
    <circle
      cx="50"
      cy="50"
      r={50 - strokeWidth / 2}
      fill="none"
      stroke="currentColor"
      strokeWidth={strokeWidth}
    />
  </Shape>
);

export const Sparkle = (props: ShapeProps) => (
  <Shape viewBox="0 0 100 100" {...props}>
    <path
      fill="currentColor"
      d="M50 0C53 30 70 47 100 50C70 53 53 70 50 100C47 70 30 53 0 50C30 47 47 30 50 0Z"
    />
  </Shape>
);

export const Squiggle = ({ size = 160, ...props }: ShapeProps) => (
  <Shape
    viewBox="0 0 160 24"
    size={size}
    height={typeof size === "number" ? size * 0.15 : undefined}
    {...props}
  >
    <path
      fill="none"
      stroke="currentColor"
      strokeWidth="6"
      strokeLinecap="round"
      d="M4 14C17 4 30 4 43 14S69 24 82 14S108 4 121 14S147 24 156 14"
    />
  </Shape>
);

export const DotGrid = ({
  size = 120,
  gap = 12,
  radius = 1.6,
  ...props
}: ShapeProps & { gap?: number; radius?: number }) => {
  const count = Math.floor(120 / gap);
  return (
    <Shape viewBox="0 0 120 120" size={size} {...props}>
      {Array.from({ length: count * count }, (_, i) => (
        <circle
          key={i}
          cx={(i % count) * gap + gap / 2}
          cy={Math.floor(i / count) * gap + gap / 2}
          r={radius}
          fill="currentColor"
        />
      ))}
    </Shape>
  );
};

export const Stripe = ({ size = 120, ...props }: ShapeProps) => (
  <Shape viewBox="0 0 120 120" size={size} {...props}>
    {Array.from({ length: 6 }, (_, i) => (
      <rect
        key={i}
        x={i * 20}
        y="0"
        width="8"
        height="120"
        rx="4"
        fill="currentColor"
        transform="skewX(-12)"
      />
    ))}
  </Shape>
);
