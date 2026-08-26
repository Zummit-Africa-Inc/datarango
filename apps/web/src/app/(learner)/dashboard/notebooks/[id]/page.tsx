import { redirect } from "next/navigation";

/**
 * There is no per-notebook page, because there is no per-notebook resource.
 *
 * The service allows exactly one live session per user (`MaxLiveSessionsPerUser`
 * — a second kernel is a second sandbox and a second memory reservation), and
 * the only reads it offers are "the caller's current session" and its
 * lifecycle. So a route keyed by id has nothing to fetch: any id a learner could
 * reach either *is* their current session, in which case the notebooks page
 * already shows it, or belongs to somebody else, in which case RLS answers
 * nothing.
 *
 * Kept as a redirect rather than deleted so old links and bookmarks land
 * somewhere useful instead of on a 404.
 */
export default function NotebookDetailPage() {
  redirect("/dashboard/notebooks");
}
