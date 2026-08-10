"use client";

import { useEffect, useRef } from "react";
import { toast } from "sonner";

import { notificationCopy } from "./notification-copy";
import { useLatestNotifications, useUnreadCount } from "./use-inbox";

/**
 * Toasts notifications as they arrive.
 *
 * Driven by the badge count rather than by polling the entries: an idle user
 * fetches one integer a minute, and the page of payloads is pulled only in the
 * moment something actually landed.
 *
 * Two rules keep this from being obnoxious, both of which exist because the
 * naive version is genuinely bad:
 *
 *   - **the first page fetched never toasts.** It is the baseline of what the
 *     user already had; announcing five things they read yesterday as if they
 *     just happened is how a notification system loses trust in its first
 *     minute. Establishing that baseline by fetching, rather than by comparing
 *     `createdAt` against the moment of mount, keeps it from depending on the
 *     browser clock agreeing with the server's;
 *   - **only entries seen for the first time toast.** The count can rise and
 *     fall for reasons other than arrival — marking one read elsewhere, another
 *     tab — so arrival is decided by entry id, not by arithmetic on the count.
 */
export const useNotificationToasts = (options: { enabled?: boolean } = {}) => {
  const enabled = options.enabled ?? true;

  const { data: unread } = useUnreadCount();
  const latest = useLatestNotifications();

  const count = unread?.unreadCount ?? 0;
  const previousCount = useRef<number | null>(null);
  const announced = useRef<Set<string>>(new Set());
  const primed = useRef(false);

  const refetchLatest = latest.refetch;

  // Pull the entries only when the badge has gone up.
  useEffect(() => {
    if (!enabled) return;

    const previous = previousCount.current;
    previousCount.current = count;

    if (previous === null || count <= previous) return;

    void refetchLatest();
  }, [enabled, count, refetchLatest]);

  const entries = latest.data?.items;

  useEffect(() => {
    if (!enabled || !entries) return;

    // The first page we ever see establishes what the user already had. It is
    // recorded as seen and deliberately not announced.
    if (!primed.current) {
      entries.forEach((entry) => announced.current.add(entry.id));
      primed.current = true;
      return;
    }

    entries
      .filter((entry) => !entry.readAt && !announced.current.has(entry.id))
      // Oldest first, so a burst reads in the order it happened.
      .reverse()
      .forEach((entry) => {
        announced.current.add(entry.id);
        const copy = notificationCopy(entry);
        toast(copy.title, { description: copy.body });
      });
  }, [enabled, entries]);
};
