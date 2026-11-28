"use client";

import { useApi } from "./use-api";

/**
 * Feature flags on for the signed-in person, from `GET /flags`. Staff manage
 * them in the admin app; a flag is on for its targeted organisations and a
 * stable percentage of everyone else. Read once and cached for a few
 * minutes, so a flag changed in admin reaches open tabs within that time.
 */
export const useFeatureFlags = (enabled = true) =>
  useApi.query<{ flags: string[] }>(["feature-flags"], "/flags", {
    orgScoped: false,
    enabled,
    staleTime: 5 * 60_000,
  });

/**
 * Whether one flag is on. False while loading and on error, so a feature
 * behind a flag stays hidden unless the flag says otherwise.
 *
 * @example const gpu = useFlag("notebooks.gpu");
 */
export const useFlag = (key: string) => useFeatureFlags().data?.flags.includes(key) ?? false;
