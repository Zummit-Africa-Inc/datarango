"use client";

import { Statistics, WidgetRenderer } from "@datarango/ui";

import {
  PLATFORM_STATS,
  REVENUE_WIDGET,
  REVIEW_QUEUE_WIDGET,
  SIGNUPS_WIDGET,
} from "@/mock/overview";

export default function OverviewPage() {
  return (
    <div className="space-y-6">
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        {PLATFORM_STATS.map((stat) => (
          <Statistics key={stat.label} {...stat} />
        ))}
      </div>

      <div className="grid gap-6 lg:grid-cols-2">
        <WidgetRenderer widget={SIGNUPS_WIDGET} />
        <WidgetRenderer widget={REVENUE_WIDGET} />
      </div>

      <WidgetRenderer widget={REVIEW_QUEUE_WIDGET} />
    </div>
  );
}
