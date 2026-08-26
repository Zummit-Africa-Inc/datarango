"use client";

import { useApi } from "@datarango/api";

/**
 * The in-app notification inbox.
 *
 * platform.notification has had `list_inbox`, `unread_count`, `mark_read` and
 * `mark_all_read` behind gateway routes for a long time and **nothing in the web
 * app called any of them** — every in-app notification the platform has ever
 * written was unreadable in the product. Same shape as the media module before
 * its UI landed.
 *
 * User-scoped under RLS, so `orgScoped: false`: an inbox belongs to the person
 * and never varies by which org they are looking at.
 */

export interface InboxEntry {
  id: string;
  /** Which notification this is — e.g. `course.published`. Drives the copy below. */
  template: string;
  category: string;
  /** Template-specific fields. Shape varies by template, so it is read defensively. */
  payload: Record<string, unknown>;
  createdAt: string;
  readAt: string | null;
}

export interface InboxPage {
  items: InboxEntry[];
  /**
   * Opaque keyset cursor. Never construct one — a tampered cursor decodes to
   * nothing and restarts from the top, which is harmless but not useful.
   */
  nextCursor: string | null;
  /**
   * Rides along with the page rather than being derived by subtracting what was
   * just read: a notification arriving between two calls makes the arithmetic
   * wrong, and this is exactly when the badge is most likely to be stale.
   */
  unreadCount: number;
}

const INBOX = ["platform-inbox"];

export const useInbox = (limit = 30) =>
  useApi.query<InboxPage>([...INBOX, String(limit)], "/platform/notifications", {
    orgScoped: false,
    params: { limit },
    staleTime: 0,
  });

export const useUnreadCount = () =>
  useApi.query<{ unreadCount: number }>(
    [...INBOX, "unread"],
    "/platform/notifications/unread-count",
    { orgScoped: false, staleTime: 0 },
  );

/** Marks specific notifications read. Idempotent — re-reading one changes nothing. */
export const useMarkRead = () =>
  useApi.mutation<{ ids: string[] }, { unreadCount: number }>("/platform/notifications/read", {
    invalidates: [INBOX],
    toast: { success: undefined },
  });

export const useMarkAllRead = () =>
  useApi.mutation<void, { unreadCount: number }>("/platform/notifications/read-all", {
    invalidates: [INBOX],
    toast: { success: "All caught up" },
  });
