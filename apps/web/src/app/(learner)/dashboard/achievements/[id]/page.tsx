import { redirect } from "next/navigation";

/**
 * No per-achievement page, because an achievement is not a resource yet.
 *
 * The gamification module has no subjects and no routes, so there is nothing
 * addressable by id to fetch. What the achievements page shows instead —
 * certificates and passed quizzes — already have their own detail surfaces (the
 * public verification page and the quiz page), so a third route in between would
 * only be a redirect with extra steps.
 *
 * Kept rather than deleted so an old link lands on the list instead of a 404.
 */
export default function AchievementDetailPage() {
  redirect("/dashboard/achievements");
}
