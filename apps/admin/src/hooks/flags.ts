"use client";

import { useApi } from "@datarango/api";

/**
 * Feature flags. A flag starts off; when enabled it is on for its targeted
 * organisations and for a stable percentage of everyone else. Every change
 * needs a reason and goes into the flag's history.
 */

export interface FeatureFlag {
  id: string;
  key: string;
  name: string;
  description: string | null;
  enabled: boolean;
  rolloutPercent: number;
  orgs: { id: string; name: string | null }[];
  createdAt: string;
  updatedAt: string;
  updatedBy: string | null;
}

export interface FlagChange {
  id: string;
  flagKey: string;
  action: "created" | "updated";
  summary: string;
  reason: string;
  at: string;
  actor: string | null;
}

const FLAGS = ["staff-flags"];

export const useFeatureFlags = (enabled = true) =>
  useApi.query<{ flags: FeatureFlag[]; history: FlagChange[] }>(FLAGS, "/staff/flags", {
    orgScoped: false,
    enabled,
  });

export const useCreateFlag = () =>
  useApi.mutation<
    { key: string; name: string; description: string | null; reason: string },
    { key: string }
  >("/staff/flags", {
    method: "POST",
    invalidates: [FLAGS],
    toast: { success: "Flag created. It starts off." },
  });

export const useUpdateFlag = () =>
  useApi.mutation<
    {
      key: string;
      name: string;
      description: string | null;
      enabled: boolean;
      rolloutPercent: number;
      orgIds: string[];
      reason: string;
    },
    { key: string }
  >((v) => `/staff/flags/${v.key}`, {
    method: "PUT",
    invalidates: [FLAGS],
    toast: { success: "Flag updated" },
  });

/** A short description of who a flag is on for. */
export const flagReach = (f: Pick<FeatureFlag, "enabled" | "rolloutPercent" | "orgs">) => {
  if (!f.enabled) return "Off for everyone";
  if (f.rolloutPercent >= 100) return "On for everyone";
  const parts: string[] = [];
  if (f.rolloutPercent > 0) parts.push(`${f.rolloutPercent}% of people`);
  if (f.orgs.length > 0)
    parts.push(`${f.orgs.length} organisation${f.orgs.length === 1 ? "" : "s"}`);
  return parts.length ? `On for ${parts.join(" and ")}` : "On, but reaches nobody yet";
};
