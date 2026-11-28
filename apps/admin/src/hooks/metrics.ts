"use client";

import { useApi } from "@datarango/api";

/**
 * The overview's numbers. Each comes from the service that owns the data and
 * each checks its own permission, so a panel is only requested when the
 * person holds that permission (the `enabled` flag).
 */

const METRICS = ["staff-metrics"];

export interface MonthCount {
  month: string;
  count: number;
}

export interface AccountMetrics {
  users: {
    total: number;
    newLast30Days: number;
    activeLast30Days: number;
    suspended: number;
    unverified: number;
    signupsByMonth: MonthCount[];
  };
  orgs: {
    total: number;
    newLast30Days: number;
    suspended: number;
    createdByMonth: MonthCount[];
  };
}

export interface CurrencyAmount {
  currency: string;
  amountMinor: number;
}

export interface BillingMetrics {
  activeOrganisations: number;
  activeIndividuals: number;
  pastDue: number;
  cancellingAtPeriodEnd: number;
  licensedSeats: number;
  monthlyRecurring: CurrencyAmount[];
  openInvoices: CurrencyAmount[];
  byMonth: {
    month: string;
    newOrganisations: number;
    newIndividuals: number;
    paid: CurrencyAmount[];
  }[];
  byPlan: { planName: string; subscriptions: number }[];
}

export interface TokenMetrics {
  rules: number;
  payingRules: number;
  heldRules: number;
  tokensRewarded: number;
  tokensRedeemed: number;
  peopleRewarded: number;
  byMonth: { month: string; rewarded: number; redeemed: number }[];
}

export interface LearningMetrics {
  courses: {
    total: number;
    byStatus: Record<"draft" | "review" | "published" | "archived", number>;
    byOwner: { platform: number; organisation: number; creator: number };
    createdByMonth: MonthCount[];
  };
  enrolments: {
    total: number;
    learners: number;
    completed: number;
    newLast30Days: number;
    activeLearnersLast30Days: number;
    byMonth: { month: string; enrolments: number; completions: number }[];
  };
}

const metric = <T>(name: string, months: number, enabled: boolean) =>
  useApi.query<T>([...METRICS, name, String(months)], `/staff/metrics/${name}`, {
    orgScoped: false,
    enabled,
    params: { months },
  });

export const useAccountMetrics = (months: number, enabled: boolean) =>
  metric<AccountMetrics>("accounts", months, enabled);

export const useBillingMetrics = (months: number, enabled: boolean) =>
  metric<BillingMetrics>("billing", months, enabled);

export const useTokenMetrics = (months: number, enabled: boolean) =>
  metric<TokenMetrics>("tokens", months, enabled);

export const useLearningMetrics = (months: number, enabled: boolean) =>
  metric<LearningMetrics>("learning", months, enabled);

/** "2026-11" → "Nov" (or "Nov 26" when the range crosses a year). */
export const monthLabel = (month: string, withYear = false) => {
  const [y, m] = month.split("-").map(Number);
  const date = new Date(y ?? 1970, (m ?? 1) - 1, 1);
  return date.toLocaleDateString(
    undefined,
    withYear ? { month: "short", year: "2-digit" } : { month: "short" },
  );
};

/** Per-person enrolment counts, for the users table's "student" column. */
export interface LearnerCount {
  userId: string;
  enrolments: number;
  completed: number;
  lastActivityAt: string;
}

export const useLearnerCounts = (userIds: string[], enabled: boolean) =>
  useApi.query<{ learners: LearnerCount[] }>(
    ["staff-learners", ...[...userIds].sort()],
    "/staff/learners",
    {
      orgScoped: false,
      enabled: enabled && userIds.length > 0,
      params: { ids: userIds.join(",") },
    },
  );
