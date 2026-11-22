import Link from "next/link";

import { Badge, CatalogueThumbnail, Price, parsePrices, pricingFromPrices } from "@datarango/ui";

import type { Course } from "@/hooks/learning";

/** Server prices are stored as a JSON string; an unreadable one shows nothing rather than "Free". */
export const CoursePrice = ({ pricesJson }: { pricesJson: string }) => {
  const prices = parsePrices(pricesJson);
  return prices ? <Price pricing={pricingFromPrices(prices)} /> : null;
};

/** Catalogue card (§7.3): thumbnail, title, summary, then price — or "Enrolled" once the learner has access. */
export const CourseCard = ({ course, enrolled }: { course: Course; enrolled: boolean }) => (
  <Link
    href={`/dashboard/courses/${course.id}`}
    className="border-border bg-card hover:border-border-strong focus-visible:ring-ring group flex h-full flex-col overflow-hidden rounded-lg border transition-colors outline-none focus-visible:ring-2"
  >
    <CatalogueThumbnail id={course.id} title={course.title} imageUrl={course.imageUrl} />
    <div className="flex flex-1 flex-col gap-2 p-4">
      <h3 className="font-display text-foreground line-clamp-2 text-lg leading-snug font-semibold group-hover:underline group-hover:underline-offset-2">
        {course.title}
      </h3>
      <p className="text-foreground-muted line-clamp-2 flex-1 text-sm">
        {course.summary || "No summary yet."}
      </p>
      <div className="mt-2 flex items-center justify-between gap-3">
        <span className="text-primary text-sm font-medium">
          {enrolled ? "Continue" : "View course"}
        </span>
        {enrolled ? (
          <Badge tone="success" appearance="soft">
            Enrolled
          </Badge>
        ) : (
          <CoursePrice pricesJson={course.pricesJson} />
        )}
      </div>
    </div>
  </Link>
);
