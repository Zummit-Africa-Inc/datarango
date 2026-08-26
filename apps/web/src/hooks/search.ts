"use client";

import { useApi } from "@datarango/api";

/**
 * Platform search, backed by Meilisearch through `platform.search`.
 *
 * Distinct from the per-kind discovery hooks (`useDiscoverCourses`,
 * `useDiscoverQuizzes`), which run a plain ILIKE over Postgres and are scoped,
 * paginated lists of one thing. This is the cross-entity ranked search those
 * cannot do — and it is deliberately additive rather than a replacement, since
 * an index outage should cost you ranking, not the ability to browse a
 * catalogue.
 *
 * **No filter parameter, and there never will be one here.** The tenant filter
 * is built server-side from the request envelope; the gateway reads an
 * allowlist of `q`/`kind`/`page`/`pageSize` and drops anything else. Adding a
 * filter to this hook would send a field with nowhere to land.
 *
 * `orgScoped: true` (the default) is right for once: results genuinely vary by
 * org context, because an org's private content is visible to its members and
 * to nobody else. Caching one org's results under another's key is exactly the
 * cross-tenant cache the query-key discipline exists to prevent.
 */

export type SearchKind = "course" | "quiz";

export interface SearchHit {
  id: string;
  kind: string;
  title: string;
  summary: string;
  slug: string | null;
  creatorId: string | null;
  updatedAt: string;
  /**
   * Kind-specific extras a result card renders. Numbers are counts
   * (moduleCount, questionCount); courses may also carry an `imageUrl` string.
   */
  facets: Record<string, number | string> | null;
}

export interface SearchResults {
  hits: SearchHit[];
  /** Meilisearch's estimate, named honestly — it is not an exact count. */
  total: number;
  /** Set when the requested kind isn't one the server indexes. */
  error: string | null;
}

const SEARCH = ["platform-search"];

export const useSearch = (options: {
  q: string;
  kind: SearchKind;
  page?: number;
  pageSize?: number;
}) =>
  useApi.query<SearchResults>(
    [...SEARCH, options.kind, options.q, String(options.page ?? 1)],
    "/search",
    {
      // An empty query would return the whole index a page at a time, which is
      // a browse, not a search — the catalogue pages already do that better.
      enabled: options.q.trim().length > 0,
      params: {
        q: options.q.trim(),
        kind: options.kind,
        page: options.page,
        pageSize: options.pageSize,
      },
    },
  );
