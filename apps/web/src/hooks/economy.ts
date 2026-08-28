"use client";

import { useApi } from "@datarango/api";

/**
 * Wallet — balance, statement, redemptions, and what a quiz pays.
 *
 * Everything here is **`orgScoped: false`**, and that is a decision rather than
 * an omission: a wallet belongs to a person, not to an org context. The balance
 * does not change when somebody switches which org they are acting for, so
 * scoping the cache per org would split one truth across two keys and refetch
 * on every switch to arrive at the same number.
 *
 * Enums cross the wire as camelCase names, not ordinals.
 */

export type TransactionKind =
  | "reward"
  | "redemptionReserve"
  | "redemptionCommit"
  | "redemptionRelease"
  | "adjustment";

export type RedemptionStatus = "reserved" | "committed" | "compensated";

export type RewardScope = "quiz" | "exercise" | "competition";

export interface Balance {
  balance: number;
  /** Null for somebody who has never earned — the page says "0", not "0 as of never". */
  updatedAt: string | null;
}

/**
 * One line of the statement. Only the caller's own side of a posting is ever
 * returned — the house side has no owner and no read policy admits it — so
 * `amount` is signed from the reader's point of view and `balanceAfter` is
 * their running balance.
 */
export interface StatementLine {
  id: string;
  transactionId: string;
  kind: TransactionKind;
  amount: number;
  balanceAfter: number;
  reference: string;
  memo: string;
  createdAt: string;
}

export interface Statement {
  balance: number;
  entries: StatementLine[];
  total: number;
}

export interface Redemption {
  id: string;
  courseId: string;
  amount: number;
  status: RedemptionStatus;
  /** The code the course service returned when an unlock failed. */
  failureCode: string | null;
  createdAt: string;
  completedAt: string | null;
}

export interface RewardRule {
  id: string;
  scope: RewardScope;
  targetId: string;
  amount: number;
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

export const TRANSACTION_LABELS: Record<TransactionKind, string> = {
  reward: "Earned",
  redemptionReserve: "Unlock",
  redemptionCommit: "Unlock settled",
  redemptionRelease: "Refunded",
  adjustment: "Adjustment",
};

// ── The learner's wallet ────────────────────────────────────────────────────

/**
 * The badge number. Separate from the statement because it is wanted on pages
 * that have no business fetching a ledger; the statement carries the balance
 * too, so the wallet page itself needs only one request.
 */
export const useWalletBalance = () =>
  useApi.query<Balance>(["wallet-balance"], "/economy/wallet", { orgScoped: false });

export const useWalletStatement = (options: { page?: number; pageSize?: number } = {}) =>
  useApi.query<Statement>(
    ["wallet-statement", String(options.page ?? 1)],
    "/economy/wallet/entries",
    {
      orgScoped: false,
      params: { page: options.page, pageSize: options.pageSize },
    },
  );

export const useRedemptions = () =>
  useApi.query<{ redemptions: Redemption[] }>(["wallet-redemptions"], "/economy/wallet/redemptions", {
    orgScoped: false,
  });

/**
 * Spends tokens on a course.
 *
 * **Never optimistic.** The API layer supports optimistic updates and this is
 * exactly the case that must not use one: the server reserves, calls the course
 * service, and either commits or gives the tokens back — so a balance shown
 * before the answer arrives is a number the platform has not agreed to yet.
 * Money and grading wait for the server.
 *
 * The enrolment queries are invalidated alongside the wallet ones because the
 * whole point of the redemption is that the course is now theirs; leaving the
 * course list stale would show them a locked course they just paid for.
 */
export const useRedeemCourse = () =>
  useApi.mutation<{ courseId: string }, { redemption: Redemption }>(
    (v) => `/economy/wallet/redemptions/${v.courseId}`,
    {
      invalidates: [
        ["wallet-balance"],
        ["wallet-statement"],
        ["wallet-redemptions"],
        ["enrollments"],
        ["enrollment"],
      ],
      toast: { success: "Unlocked — the course is in your library." },
    },
  );

/** What a quiz pays, as anyone may see it. Null when it pays nothing. */
export const useRewardRule = (scope: RewardScope, targetId: string) =>
  useApi.query<{ rule: RewardRule | null }>(
    ["wallet-reward-rule", scope, targetId],
    `/economy/rewards/rules/${scope}/${targetId}`,
    { orgScoped: false, enabled: !!targetId },
  );

/** What a course costs in tokens. Null means it is not redeemable at all. */
export const useCoursePrice = (courseId: string) =>
  useApi.query<{ price: CoursePrice | null }>(
    ["wallet-course-price", courseId],
    `/economy/prices/${courseId}`,
    { orgScoped: false, enabled: !!courseId },
  );

// ── Gamification ────────────────────────────────────────────────────────────

export type BadgeCriterion =
  | "xpTotal"
  | "streakDays"
  | "quizzesPassed"
  | "lessonsCompleted"
  | "coursesCompleted";

export interface Standing {
  xp: number;
  level: number;
  /** XP earned into the current level, and what the level spans — a progress bar
   *  fed the raw total fills once and never moves again. */
  xpIntoLevel: number;
  xpForLevel: number;
  /** Derived server-side from the last active day: zero once a run has lapsed. */
  currentStreak: number;
  longestStreak: number;
  lastActiveDay: string | null;
  quizzesPassed: number;
  lessonsCompleted: number;
  coursesCompleted: number;
}

export interface EarnableBadge {
  id: string;
  slug: string;
  name: string;
  description: string;
  criterion: BadgeCriterion;
  threshold: number;
  /** Null when not yet earned — unearned badges are listed on purpose. */
  earnedAt: string | null;
}

export interface RankedPlayer {
  rank: number;
  userId: string;
  displayName: string;
  xp: number;
  level: number;
  currentStreak: number;
  /** Marked server-side so the client never has to compare ids it would
   *  otherwise need to be told. */
  isYou: boolean;
}

export const useStanding = () =>
  useApi.query<Standing>(["progress-standing"], "/economy/progress", { orgScoped: false });

export const useBadges = () =>
  useApi.query<{ badges: EarnableBadge[]; earned: number }>(
    ["progress-badges"],
    "/economy/progress/badges",
    { orgScoped: false },
  );

export const useLeaderboard = (take = 20) =>
  useApi.query<{ players: RankedPlayer[] }>(
    ["progress-leaderboard", String(take)],
    "/economy/progress/leaderboard",
    { orgScoped: false, params: { take } },
  );

/**
 * Which counter a badge is measured against, for rendering "7 / 10" under an
 * unearned one. Mirrors the server's BadgeCriterion → profile counter mapping;
 * if a criterion is added there, this map must say the same thing about it.
 */
export const badgeProgress = (badge: EarnableBadge, standing: Standing | undefined): number => {
  if (!standing) return 0;
  switch (badge.criterion) {
    case "xpTotal":
      return standing.xp;
    // The LONGEST streak, matching the server — a badge you could lose by
    // taking a week off would punish rest.
    case "streakDays":
      return standing.longestStreak;
    case "quizzesPassed":
      return standing.quizzesPassed;
    case "lessonsCompleted":
      return standing.lessonsCompleted;
    case "coursesCompleted":
      return standing.coursesCompleted;
  }
};

// ── The creator's configuration (studio) ────────────────────────────────────

export const useMyRewardRules = () =>
  useApi.query<{ rules: RewardRule[] }>(["wallet-reward-rules"], "/economy/rewards/rules", {
    orgScoped: false,
  });

export const useMyCoursePrices = () =>
  useApi.query<{ prices: CoursePrice[] }>(["wallet-course-prices"], "/economy/prices", {
    orgScoped: false,
  });

export const useUpsertRewardRule = () =>
  useApi.mutation<
    { scope: RewardScope; targetId: string; amount: number; maxAwardsPerUser?: number; enabled?: boolean },
    { rule: RewardRule }
  >((v) => `/economy/rewards/rules/${v.scope}/${v.targetId}`, {
    method: "PUT",
    invalidates: [["wallet-reward-rules"], ["wallet-reward-rule"]],
    toast: { success: "Reward saved." },
  });

export const useUpsertCoursePrice = () =>
  useApi.mutation<{ courseId: string; tokenPrice: number; enabled?: boolean }, { price: CoursePrice }>(
    (v) => `/economy/prices/${v.courseId}`,
    {
      method: "PUT",
      invalidates: [["wallet-course-prices"], ["wallet-course-price"]],
      toast: { success: "Price saved." },
    },
  );
