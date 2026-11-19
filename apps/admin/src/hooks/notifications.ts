"use client";

import { useApi } from "@datarango/api";

/**
 * The notification dead-letter queue (`/platform/notifications/dead*`).
 *
 * Platform-scoped, so `orgScoped: false` throughout. The server checks the
 * platform role on every call: support (or admin) reads, only admin requeues,
 * because a requeue sends real email to real people.
 */

export type NotificationChannel = "email" | "inApp" | "push";

export interface DeadLetter {
  id: string;
  userId: string | null;
  recipient: string;
  channel: NotificationChannel;
  template: string;
  category: string;
  attempts: number;
  lastError: string | null;
  createdAt: string;
  deadAt: string;
}

export interface DeadLetterPage {
  items: DeadLetter[];
  total: number;
  page: number;
  pageSize: number;
}

const DEAD = ["notification-dead"];

export const useDeadLetters = (options: {
  channel?: NotificationChannel;
  page?: number;
  pageSize?: number;
}) =>
  useApi.query<DeadLetterPage>(
    [...DEAD, options.channel ?? "all", String(options.page ?? 1)],
    "/platform/notifications/dead",
    {
      orgScoped: false,
      params: { channel: options.channel, page: options.page, pageSize: options.pageSize },
    },
  );

/** At most 100 ids per call; the server refuses more rather than truncating. */
export const useRequeueDeadLetters = () =>
  useApi.mutation<{ ids: string[] }, { requested: number; requeued: number }>(
    "/platform/notifications/dead/requeue",
    { invalidates: [DEAD], toast: { success: "Requeued for delivery" } },
  );
