"use client";

import { useApi } from "@datarango/api";

/**
 * The creator's half of the token economy: what a quiz pays, and what a course
 * costs to unlock.
 *
 * **`orgScoped: false` throughout.** A reward rule belongs to the creator who
 * set it, not to an org context — arena scopes competitions to their creator
 * for the same reason. Scoping these per org would split one truth across two
 * cache keys and refetch on every switch to arrive at the same row.
 *
 * The server owns every rule about these values (ceilings, ownership, whether a
 * target already belongs to somebody else); nothing here re-implements them, it
 * only avoids sending obviously-invalid input.
 */

export type RewardScope = "quiz" | "exercise" | "competition";

export interface RewardRule {
  id: string;
  scope: RewardScope;
  targetId: string;
  amount: number;
  /** How many times one person can be paid by this rule. 1 by default — a quiz
   *  that can be retaken is a quiz that can be farmed. */
  maxAwardsPerUser: number;
  enabled: boolean;
  updatedAt: string;
}

export interface CoursePrice {
  id: string;
  courseId: string;
  tokenPrice: number;
  enabled: boolean;
  updatedAt: string;
}

/**
 * What this quiz pays. `rule: null` means it pays nothing, which is a real
 * answer rather than a 404 — most quizzes have no reward and the editor should
 * render an empty form, not an error.
 */
export const useRewardRule = (scope: RewardScope, targetId: string) =>
  useApi.query<{ rule: RewardRule | null }>(
    ["reward-rule", scope, targetId],
    `/economy/rewards/rules/${scope}/${targetId}`,
    { orgScoped: false, enabled: !!targetId },
  );

export const useMyRewardRules = () =>
  useApi.query<{ rules: RewardRule[] }>(["reward-rules"], "/economy/rewards/rules", {
    orgScoped: false,
  });

export const useUpsertRewardRule = (scope: RewardScope, targetId: string) =>
  useApi.mutation<
    { amount: number; maxAwardsPerUser: number; enabled: boolean },
    { rule: RewardRule }
  >(`/economy/rewards/rules/${scope}/${targetId}`, {
    method: "PUT",
    invalidates: [
      ["reward-rule", scope, targetId],
      ["reward-rules"],
    ],
    toast: { success: "Reward saved." },
  });

export const useDeleteRewardRule = (scope: RewardScope, targetId: string) =>
  useApi.mutation<{ ruleId: string }, { deleted: boolean }>(
    (v) => `/economy/rewards/rules/${v.ruleId}`,
    {
      method: "DELETE",
      invalidates: [
        ["reward-rule", scope, targetId],
        ["reward-rules"],
      ],
      // Says what removal actually does, because the obvious assumption is
      // wrong: the server keeps every grant it already made.
      toast: { success: "Reward removed. Tokens already earned are untouched." },
    },
  );

export const useCoursePrice = (courseId: string) =>
  useApi.query<{ price: CoursePrice | null }>(
    ["course-price", courseId],
    `/economy/prices/${courseId}`,
    { orgScoped: false, enabled: !!courseId },
  );

export const useUpsertCoursePrice = (courseId: string) =>
  useApi.mutation<{ tokenPrice: number; enabled: boolean }, { price: CoursePrice }>(
    `/economy/prices/${courseId}`,
    {
      method: "PUT",
      invalidates: [["course-price", courseId]],
      toast: { success: "Price saved." },
    },
  );
