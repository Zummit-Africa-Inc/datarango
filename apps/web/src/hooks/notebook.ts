"use client";

import { useApi } from "@datarango/api";

/**
 * Notebook sessions.
 *
 * Personal-scoped, never org-scoped: a notebook belongs to the person, not to
 * whichever org they happen to be looking at. The gateway records the org from
 * the envelope for attribution but the read policy stays owner-scoped, so these
 * queries pass `orgScoped: false` — org-keying the cache would fragment it for
 * data that never varies by org.
 *
 * There is exactly **one live session per user** (`MaxLiveSessionsPerUser`), so
 * there is no list endpoint and no per-notebook route to build: the surface is
 * one session, its lifecycle, and the quota that bounds it.
 */

/**
 * `pending` and `starting` are separate on purpose — pulling a kernel image can
 * take tens of seconds, and a learner watching a spinner deserves to know which
 * of the two is happening. Both occupy the quota.
 */
export type SessionStatus = "pending" | "starting" | "running" | "stopping" | "stopped" | "failed";

export interface NotebookSession {
  id: string;
  status: SessionStatus;
  image: string;
  createdAt: string;
  startedAt: string | null;
  lastSeenAt: string;
  /** Absolute lifetime cap — reached whether or not the kernel is busy. */
  expiresAt: string;
  /** Why it ended. Set for `failed`, and for a `stopped` session the reaper claimed. */
  stoppedReason: string | null;
}

/** Statuses that hold the quota — i.e. where "start a notebook" must not be offered. */
export const LIVE_STATUSES: SessionStatus[] = ["pending", "starting", "running", "stopping"];

export const isLive = (session: NotebookSession | null | undefined) =>
  !!session && LIVE_STATUSES.includes(session.status);

const CURRENT = ["notebook-session"];

/**
 * The caller's live session, or null.
 *
 * Null is the ordinary state rather than a missing resource — most people do not
 * have a kernel running — so the server answers ok-with-null and this renders
 * "start a notebook" rather than an error.
 *
 * Polled while a session is coming up: `pending` → `starting` → `running` are
 * driven by the sandbox on its own schedule, so nothing pushes the transition to
 * the client. The interval is deliberately off once the session settles.
 */
export const useCurrentSession = () =>
  useApi.query<{ session: NotebookSession | null }>(CURRENT, "/notebook/sessions/current", {
    orgScoped: false,
    staleTime: 0,
    refetchInterval: (data) => {
      const status = data?.session?.status;
      return status === "pending" || status === "starting" || status === "stopping" ? 2000 : false;
    },
  });

/** Start-or-return, so a double click costs one kernel rather than two. */
export const useRequestSession = () =>
  useApi.mutation<void, NotebookSession>("/notebook/sessions", {
    invalidates: [CURRENT],
    toast: { success: "Notebook starting" },
  });

/**
 * Keeps the session alive. Absence of a heartbeat for the idle timeout is what
 * lets the reaper reclaim a kernel somebody walked away from, so this is the
 * client's half of that bargain — not a health check.
 */
export const useHeartbeat = (sessionId: string) =>
  useApi.mutation<void, NotebookSession>(`/notebook/sessions/${sessionId}/heartbeat`, {
    invalidates: [CURRENT],
    toast: { success: undefined },
  });

export const useStopSession = (sessionId: string) =>
  useApi.mutation<void, NotebookSession>(`/notebook/sessions/${sessionId}/stop`, {
    invalidates: [CURRENT],
    toast: { success: "Notebook stopped" },
  });
