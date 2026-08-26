"use client";

import { useApi } from "@datarango/api";

/**
 * Org-private competitions.
 *
 * The org half of arena, and the one place in the product where `orgScoped`
 * matters more than anywhere else. Everything here rides the **default
 * org-scoped** path so `@datarango/api` stamps `X-Org-Id` — and that header is
 * the whole mechanism: the gateway's resolver proves the caller is a member
 * before it stamps anything, `create_competition` records the org id it was
 * given, and the RLS discover policy then admits the row to that org's members
 * and nobody else. Passing `orgScoped: false` here (as the learner-facing
 * `web` hooks correctly do) would create PUBLIC competitions from an org
 * screen, which is the opposite of what this surface is for.
 *
 * There is deliberately no dataset half here: datasets are owner-scoped, and an
 * org-private competition still pins an ordinary published dataset version.
 */

export type Metric = "accuracy" | "f1" | "rocAuc" | "mae" | "rmse" | "logLoss";
export type CompetitionStatus = "draft" | "open" | "closed";

/** True when a HIGHER score ranks better. Mirrors the server's MetricRules — the leaderboard's ORDER BY agrees with this. */
export const HIGHER_IS_BETTER: Record<Metric, boolean> = {
  accuracy: true,
  f1: true,
  rocAuc: true,
  mae: false,
  rmse: false,
  logLoss: false,
};

export const METRIC_LABEL: Record<Metric, string> = {
  accuracy: "Accuracy",
  f1: "F1",
  rocAuc: "ROC AUC",
  mae: "MAE",
  rmse: "RMSE",
  logLoss: "Log loss",
};

export interface Competition {
  id: string;
  ownerId: string;
  /** Null for a public competition. Set means org-private — enforced by RLS, not by a filter here. */
  orgId: string | null;
  slug: string;
  title: string;
  summary: string;
  datasetId: string;
  datasetVersionId: string;
  metric: Metric;
  status: CompetitionStatus;
  startsAt: string | null;
  endsAt: string | null;
  maxSubmissionsPerDay: number;
  tokenRewardTotal: number;
  tokenRewardPlacements: number;
  createdAt: string;
  updatedAt: string;
}

export interface CompetitionList {
  competitions: Competition[];
  total: number;
}

export interface Dataset {
  id: string;
  slug: string;
  title: string;
  summary: string;
  license: string;
  status: "draft" | "published";
  currentVersionId: string | null;
}

export interface DatasetVersion {
  id: string;
  datasetId: string;
  number: number;
  notes: string;
  status: "draft" | "published";
  publishedAt: string | null;
}

export interface VersionListing {
  versions: DatasetVersion[];
}

export interface LeaderboardEntry {
  userId: string;
  displayName: string;
  score: string;
  submissionId: string;
}

export interface Leaderboard {
  entries: LeaderboardEntry[];
  participantCount: number;
}

const COMPETITIONS = ["arena-org-competitions"];
const competitionKey = (id: string) => ["arena-org-competition", id];

/**
 * The caller's own competitions.
 *
 * `list_competitions` is owner-scoped, so this is "competitions I run" rather
 * than "competitions this org has" — a distinction the screen states out loud,
 * because arena has no org-level ownership and another member's org-private
 * competition is manageable only by them.
 */
export const useMyCompetitions = (options: { page?: number; pageSize?: number } = {}) =>
  useApi.query<CompetitionList>(
    [...COMPETITIONS, String(options.page ?? 1)],
    "/arena/competitions",
    { params: { page: options.page, pageSize: options.pageSize ?? 50 } },
  );

/**
 * What this org can see — its own private competitions plus every public one.
 *
 * The same endpoint the learner uses; the difference is entirely the org header
 * this hook sends and the RLS policy that reads it.
 */
export const useOrgDiscoverable = (options: { search?: string; pageSize?: number } = {}) =>
  useApi.query<CompetitionList>(
    [...COMPETITIONS, "discover", options.search ?? ""],
    "/arena/competitions/discover",
    { params: { search: options.search || undefined, pageSize: options.pageSize ?? 50 } },
  );

export const useLeaderboard = (competitionId: string, enabled: boolean) =>
  useApi.query<Leaderboard>(
    [...competitionKey(competitionId), "leaderboard"],
    `/arena/competitions/${competitionId}/leaderboard`,
    { enabled: !!competitionId && enabled },
  );

/** Published datasets to pin. Owner-scoped list, drafts included — the form filters. */
export const useMyDatasets = () =>
  useApi.query<{ datasets: Dataset[]; total: number }>(["arena-org-datasets"], "/arena/datasets", {
    params: { pageSize: 100 },
  });

export const useDatasetVersions = (datasetId: string) =>
  useApi.query<VersionListing>(
    ["arena-org-dataset-versions", datasetId],
    `/arena/datasets/${datasetId}/versions`,
    { enabled: !!datasetId },
  );

export interface CreateCompetitionInput {
  slug: string;
  title: string;
  summary: string;
  datasetId: string;
  datasetVersionId: string;
  metric: Metric;
  startsAt: string | null;
  endsAt: string | null;
  maxSubmissionsPerDay: number;
  tokenRewardTotal: number;
  tokenRewardPlacements: number;
}

/**
 * Creates an ORG-PRIVATE competition, because this call carries `X-Org-Id`.
 *
 * The org id is never a body field — it comes from the envelope the gateway
 * stamps after proving membership, so a caller cannot name an org they do not
 * belong to.
 */
export const useCreateOrgCompetition = () =>
  useApi.mutation<CreateCompetitionInput, { competition: Competition }>("/arena/competitions", {
    invalidates: [COMPETITIONS],
    toast: { success: "Competition created" },
  });

export const useOpenCompetition = (competitionId: string) =>
  useApi.mutation<void, { competition: Competition }>(`/arena/competitions/${competitionId}/open`, {
    invalidates: [COMPETITIONS],
    toast: { success: "Competition opened" },
  });

/** Closing is final — a closed competition cannot reopen, and its leaderboard is the record. */
export const useCloseCompetition = (competitionId: string) =>
  useApi.mutation<void, { competition: Competition }>(
    `/arena/competitions/${competitionId}/close`,
    { invalidates: [COMPETITIONS], toast: { success: "Competition closed" } },
  );
