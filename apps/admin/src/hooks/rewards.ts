"use client";

import { useApi } from "@datarango/api";

import type { TokenMetrics } from "@/hooks/metrics";

/**
 * Token reward rules across every creator. Creators set what passing their
 * quiz pays; staff with rewards:rules:manage can change a rule, switch it off,
 * or hold it (stops payouts until staff lift it; the creator can't). Every
 * staff change needs a reason and is kept.
 */

export type RewardScope = "quiz" | "exercise" | "competition";
export type RewardState = "paying" | "disabled" | "held";

export const REWARD_SCOPE_LABEL: Record<RewardScope, string> = {
  quiz: "Quiz",
  exercise: "Exercise",
  competition: "Competition",
};

export interface StaffRewardRule {
  id: string;
  ownerId: string;
  scope: RewardScope;
  targetId: string;
  amount: number;
  maxAwardsPerUser: number;
  enabled: boolean;
  held: boolean;
  heldAt: string | null;
  heldReason: string | null;
  createdAt: string;
  updatedAt: string;
  grants: number;
  tokensPaid: number;
  people: number;
  lastPaidAt: string | null;
}

export interface RewardRuleChange {
  id: string;
  ruleId: string;
  actorId: string;
  summary: string;
  reason: string;
  at: string;
}

export interface StaffRewardRulePage {
  items: StaffRewardRule[];
  total: number;
  page: number;
  pageSize: number;
  totals: TokenMetrics;
  history: RewardRuleChange[];
}

const RULES = ["staff-reward-rules"];

export const useStaffRewardRules = (filters: {
  scope?: RewardScope | "";
  state?: RewardState | "";
  page?: number;
  pageSize?: number;
}) =>
  useApi.query<StaffRewardRulePage>(
    [...RULES, filters.scope ?? "", filters.state ?? "", String(filters.page ?? 1)],
    "/staff/rewards/rules",
    {
      orgScoped: false,
      params: {
        scope: filters.scope || undefined,
        state: filters.state || undefined,
        page: filters.page,
        pageSize: filters.pageSize ?? 25,
      },
    },
  );

export const useUpdateRewardRule = () =>
  useApi.mutation<
    {
      ruleId: string;
      amount: number;
      maxAwardsPerUser: number;
      enabled: boolean;
      held: boolean;
      reason: string;
    },
    unknown
  >((v) => `/staff/rewards/rules/${v.ruleId}`, {
    method: "PUT",
    invalidates: [RULES, ["staff-metrics"]],
    toast: { success: "Reward rule updated" },
  });

/** Which state a rule is in, for its badge. */
export const ruleState = (r: Pick<StaffRewardRule, "enabled" | "held">): RewardState =>
  r.held ? "held" : r.enabled ? "paying" : "disabled";
