"use client";

import {
  Bar,
  BarChart as RechartsBarChart,
  Cell,
  ResponsiveContainer,
  Tooltip,
  XAxis,
} from "recharts";

import type { AccentToken } from "../../config/accents";
import { cn } from "../../lib";

export interface BarDatum {
  label: string;
  value: number;
  /** Greyed out, e.g. future days or periods with no activity. */
  inactive?: boolean;
}

export interface BarChartProps {
  data: BarDatum[];
  /** Index drawn in the highlight colour (defaults to the last active bar). */
  highlightIndex?: number;
  accent?: AccentToken | "primary";
  height?: number;
  formatValue?: (value: number) => string;
  /** Accessible summary; the chart itself is hidden from assistive tech. */
  label: string;
  className?: string;
}

const fillFor = (accent: AccentToken | "primary") =>
  accent === "primary" ? "var(--primary)" : `var(--${accent}-solid)`;

/**
 * The one chart wrapper (§5): rounded bars, muted inactive periods, one highlighted bar
 * and a dark tooltip card. Colours come from CSS variables, so it follows the theme.
 */
export const BarChart = ({
  data,
  highlightIndex,
  accent = "primary",
  height = 180,
  formatValue = (v) => v.toLocaleString("en-GB"),
  label,
  className,
}: BarChartProps) => {
  const lastActive = data.reduce((last, d, i) => (d.inactive ? last : i), -1);
  const highlight = highlightIndex ?? lastActive;
  return (
    <figure className={cn("w-full", className)}>
      <figcaption className="sr-only">
        {label}: {data.map((d) => `${d.label} ${formatValue(d.value)}`).join(", ")}
      </figcaption>
      <div aria-hidden="true" style={{ height }}>
        <ResponsiveContainer width="100%" height="100%">
          <RechartsBarChart data={data} margin={{ top: 8, right: 0, bottom: 0, left: 0 }}>
            <XAxis
              dataKey="label"
              axisLine={false}
              tickLine={false}
              tickMargin={8}
              tick={{ fill: "var(--foreground-subtle)", fontSize: 12 }}
            />
            <Tooltip
              cursor={false}
              content={({ active, payload }) => {
                const datum = payload?.[0]?.payload as BarDatum | undefined;
                if (!active || !datum) return null;
                return (
                  <div className="bg-band text-on-band rounded-sm px-3 py-2 text-xs shadow-sm">
                    <p className="text-on-band-muted">{datum.label}</p>
                    <p className="font-display text-sm font-semibold tabular-nums">
                      {formatValue(datum.value)}
                    </p>
                  </div>
                );
              }}
            />
            <Bar dataKey="value" radius={[999, 999, 999, 999]} maxBarSize={28}>
              {data.map((d, i) => (
                <Cell
                  key={d.label}
                  fill={d.inactive ? "var(--chart-muted)" : fillFor(accent)}
                  fillOpacity={d.inactive || i === highlight ? 1 : 0.3}
                />
              ))}
            </Bar>
          </RechartsBarChart>
        </ResponsiveContainer>
      </div>
    </figure>
  );
};
