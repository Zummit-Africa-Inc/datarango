"use client";

import { ArrowRight, CircleStar, Coins, FileBadge, Zap } from "lucide-react";
import Link from "next/link";

import { Button, fromSnakeCase, Statistics, WidgetRenderer } from "@datarango/ui";

import { ACTIVITY_WIDGET, CONTINUE_LEARNING, QUIZ_WIDGET } from "@/mock/dashboard";

export default function DashboardPage() {
  return (
    <div className="space-y-6">
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <Statistics
          label="DAY STREAK"
          value="0"
          icon={Zap}
          delta="+0"
          description="No delta available yet"
        />
        <Statistics
          label="TOTAL XP"
          value="0"
          icon={CircleStar}
          delta="+0"
          description="No delta available yet"
        />
        <Statistics
          label="TOKEN BALANCE"
          value="0 DRG"
          icon={Coins}
          delta="+0"
          description="No delta available yet"
        />
        <Statistics
          label="CERTIFICATED"
          value="0"
          icon={FileBadge}
          delta="+0"
          description="No delta available yet"
        />
      </div>
      <div className="grid gap-6 lg:grid-cols-2">
        <WidgetRenderer widget={ACTIVITY_WIDGET} />
        <WidgetRenderer widget={QUIZ_WIDGET} />
      </div>
      <section className="space-y-3">
        <div className="flex items-center justify-between">
          <h2 className="font-heading text-lg">Continue learning</h2>
          <Button asChild size="sm" variant="ghost">
            <Link href="/dashboard/courses">
              All courses <ArrowRight className="size-4" />
            </Link>
          </Button>
        </div>
        <div className="grid gap-4 lg:grid-cols-3">
          {CONTINUE_LEARNING.map((course) => (
            <Link
              className="border-border bg-card hover:border-primary-300 block rounded-xs border p-5 transition-colors"
              href={`/dashboard/course/${course.id}`}
              key={course.id}
            >
              <p className="text-muted-foreground text-xs">{course.source}</p>
              <p className="font-heading mt-1 text-xl capitalize">{fromSnakeCase(course.courseTitle.split('.')[0])}</p>
              <p className="text-muted-foreground mt-1 text-sm">{course.currentModuleTitle}</p>
              <div className="bg-muted mt-4 h-2 rounded-full">
                <div
                  className="bg-primary-500 h-2 rounded-full"
                  style={{ width: `${course.progress}%` }}
                />
              </div>
              <p className="text-muted-foreground mt-2 text-xs">{course.progress}% complete</p>
            </Link>
          ))}
        </div>
      </section>
    </div>
  );
}
