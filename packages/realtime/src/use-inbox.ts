"use client";

import { useApi } from "@datarango/api";

import type { InboxEntry, InboxPage, MarkReadResult, UnreadCount } from "./types";

/**
 * The in-app inbox client.
 *
 * **Polling, for now.** The handoff's design is a Postgres inbox pushed over the
 * gateway WebSocket, and that proxy does not exist yet. Polling is the honest
 * interim rather than a compromise: the server's own `InAppSender` notes that
 * the inbox row *is* the truth and a missed push costs a delay, not a
 * notification. When the socket lands it replaces what drives these query keys
 * and no call site changes.
 *
 * Everything is `orgScoped: false`. An inbox belongs to the person, not to
 * whichever org context they are currently looking at — a course an org
 * assigned still notifies the learner. Scoping the cache by org would split one
 * person's notifications across two caches and drop the badge to zero on an org
 * switch.
 */

const INBOX = ["notifications-inbox"];
const UNREAD = ["notifications-unread"];

/** How often the badge polls. Cheap: one aggregate, no payloads. */
const UNREAD_POLL_MS = 60_000;

/**
 * The badge count for the whole inbox, not a page of it.
 *
 * Its own endpoint rather than a field read off the list, because the badge is
 * live for every signed-in user on every screen while the panel is opened
 * rarely — this is the request that runs all day, so it stays an aggregate.
 */
export const useUnreadCount = () =>
  useApi.query<UnreadCount>(UNREAD, "/platform/notifications/unread-count", {
    orgScoped: false,
    refetchInterval: UNREAD_POLL_MS,
  });

/**
 * The inbox itself, cursor-paginated. Enabled by the caller so the panel does
 * not fetch a page of payloads for a bell nobody has clicked.
 */
export const useInbox = (options: { enabled?: boolean } = {}) =>
  useApi.paginated<InboxEntry>(INBOX, "/platform/notifications/", {
    orgScoped: false,
    enabled: options.enabled ?? true,
    limit: 20,
  });

/**
 * The newest entries. Fetched once on mount and then only on demand — the toast
 * hook refetches when the badge count has actually risen, rather than polling
 * payloads on a timer.
 *
 * The mount fetch is not waste: it is what establishes which notifications the
 * user already had, so the first real arrival can be told apart from a backlog.
 * Doing that with timestamps instead would make the feature depend on the
 * browser clock agreeing with the server's.
 */
export const useLatestNotifications = () =>
  useApi.query<InboxPage>([...INBOX, "latest"], "/platform/notifications/", {
    orgScoped: false,
    params: { limit: 10 },
  });

/**
 * Marks entries read.
 *
 * Both keys are invalidated, and the badge one matters most: a panel that
 * greys a row while the bell still reads "3" is the version of this feature
 * people distrust.
 */
export const useMarkNotificationsRead = () =>
  useApi.mutation<{ ids: string[] }, MarkReadResult>("/platform/notifications/read", {
    invalidates: [INBOX, UNREAD],
  });

export const useMarkAllNotificationsRead = () =>
  useApi.mutation<void, MarkReadResult>("/platform/notifications/read-all", {
    invalidates: [INBOX, UNREAD],
  });

export { INBOX as inboxQueryKey, UNREAD as unreadQueryKey };
