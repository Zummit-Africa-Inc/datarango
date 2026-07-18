"use client";

import { Statistics, WidgetRenderer } from "@datarango/ui";

import {
  ACTIVE_LEARNERS_WIDGET,
  COMPLETIONS_WIDGET,
  ORG_STATS,
  RECENT_ASSIGNMENTS_WIDGET,
  SEAT_WIDGET,
} from "@/mock/overview";

export default function OverviewPage() {
  return (
    <div className="space-y-6">
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        {ORG_STATS.map((stat) => (
          <Statistics key={stat.label} {...stat} />
        ))}
      </div>

      <div className="grid gap-6 lg:grid-cols-3">
        <WidgetRenderer className="lg:col-span-2" widget={ACTIVE_LEARNERS_WIDGET} />
        <WidgetRenderer widget={SEAT_WIDGET} />
      </div>

      <div className="grid gap-6 lg:grid-cols-2">
        <WidgetRenderer widget={COMPLETIONS_WIDGET} />
        <WidgetRenderer widget={RECENT_ASSIGNMENTS_WIDGET} />
      </div>

      <p className="text-muted-foreground text-xs">
        Usage figures update live as courses are assigned; the invoice at cycle close mirrors this
        meter line-for-line. Members always keep access to courses already granted.
      </p>
    </div>
  );
}
