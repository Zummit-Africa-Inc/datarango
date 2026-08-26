"use client";

import { useApi } from "@datarango/api";

/**
 * Learner-facing arena API — datasets and competitions.
 *
 * Scoping follows what actually varies by org context: competition discovery
 * and detail genuinely differ for org members (org-private competitions are
 * invisible outside their org), so those queries stay org-scoped. Dataset
 * discovery is published-to-everyone and never varies by org; submissions are
 * the learner's own rows regardless of who granted a seat — both are
 * `orgScoped: false`, mirroring enrolments.
 *
 * Enums cross the wire as camelCase names, not ordinals.
 */

export type DatasetStatus = "draft" | "published";
export type DatasetFileStatus = "pending" | "ready" | "failed";
export type CompetitionStatus = "draft" | "open" | "closed";
export type SubmissionStatus = "awaitingUpload" | "pendingScoring" | "scored" | "failed";
export type Metric = "accuracy" | "f1" | "rocAuc" | "mae" | "rmse" | "logLoss";

export interface Dataset {
  id: string;
  ownerId: string;
  orgId: string | null;
  slug: string;
  title: string;
  summary: string;
  license: string;
  tags: string[];
  status: DatasetStatus;
  currentVersionId: string | null;
  downloadCount: number;
  createdAt: string;
  updatedAt: string;
}

export interface DatasetList {
  datasets: Dataset[];
  total: number;
}

export interface DatasetVersion {
  id: string;
  datasetId: string;
  number: number;
  notes: string;
  status: DatasetStatus;
  publishedAt: string | null;
  createdAt: string;
}

export interface DatasetFile {
  id: string;
  versionId: string;
  path: string;
  contentType: string;
  sizeBytes: number;
  status: DatasetFileStatus;
  createdAt: string;
}

export interface VersionListing {
  versions: DatasetVersion[];
  files: DatasetFile[];
}

/** A presigned GET — the only way bytes leave the private bucket. */
export interface DownloadTicket {
  fileName: string;
  url: string;
  expiresAt: string;
}

export interface Competition {
  id: string;
  ownerId: string;
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

export interface CompetitionDetail {
  competition: Competition;
  joined: boolean;
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

export interface Submission {
  id: string;
  competitionId: string;
  userId: string;
  fileName: string;
  sizeBytes: number;
  status: SubmissionStatus;
  score: string | null;
  scoredAt: string | null;
  submittedAt: string | null;
}

export interface MySubmissions {
  submissions: Submission[];
  todayCount: number;
}

export interface SubmissionTicket {
  submissionId: string;
  uploadUrl: string;
  method: string;
  contentType: string;
  expiresAt: string;
}

/**
 * Mirrors the server's MetricRules — the single source of ranking direction.
 * If a metric is ever added there, this map must say the same thing about it.
 */
export const METRIC_HIGHER_IS_BETTER: Record<Metric, boolean> = {
  accuracy: true,
  f1: true,
  rocAuc: true,
  mae: false,
  rmse: false,
  logLoss: false,
};

export const METRIC_LABELS: Record<Metric, string> = {
  accuracy: "Accuracy",
  f1: "F1",
  rocAuc: "ROC AUC",
  mae: "MAE",
  rmse: "RMSE",
  logLoss: "Log loss",
};

/** Submissions are CSV only, capped to match the server's SubmissionLimits. */
export const SUBMISSION_MAX_BYTES = 20 * 1024 * 1024;

// ── Datasets ───────────────────────────────────────────────────────────────

/** Published datasets from every owner — not a creator's drafting list. */
export const useDiscoverDatasets = (options: {
  search?: string;
  page?: number;
  pageSize?: number;
}) =>
  useApi.query<DatasetList>(
    ["arena-datasets-discover", options.search ?? "", String(options.page ?? 1)],
    "/arena/datasets/discover",
    {
      orgScoped: false,
      params: {
        search: options.search || undefined,
        page: options.page,
        pageSize: options.pageSize,
      },
    },
  );

export const useDataset = (datasetId: string) =>
  useApi.query<Dataset>(["arena-dataset", datasetId], `/arena/datasets/${datasetId}`, {
    orgScoped: false,
    enabled: !!datasetId,
  });

/** Versions with their files — the detail page's contents table. */
export const useDatasetVersions = (datasetId: string) =>
  useApi.query<VersionListing>(
    ["arena-dataset-versions", datasetId],
    `/arena/datasets/${datasetId}/versions`,
    {
      orgScoped: false,
      enabled: !!datasetId,
    },
  );

/**
 * Mints a ten-minute presigned GET. The URL is opened directly by the browser
 * — it carries its own authorisation in the signature, so nothing else belongs
 * on that request (the same rule that keeps upload bytes off @datarango/api).
 */
export const useDownloadDatasetFile = () =>
  useApi.mutation<{ fileId: string }, DownloadTicket>(
    (v) => `/arena/datasets/files/${v.fileId}/download`,
    { toast: { error: "Could not start the download." } },
  );

// ── Competitions ───────────────────────────────────────────────────────────

/** Open/closed competitions across the platform, plus the caller's org's private ones. */
export const useDiscoverCompetitions = (options: {
  search?: string;
  page?: number;
  pageSize?: number;
}) =>
  useApi.query<CompetitionList>(
    ["arena-competitions-discover", options.search ?? "", String(options.page ?? 1)],
    "/arena/competitions/discover",
    {
      // Org-private visibility varies by org context — cache per org (§3).
      params: {
        search: options.search || undefined,
        page: options.page,
        pageSize: options.pageSize,
      },
    },
  );

/** Detail + whether the caller has already joined. */
export const useCompetition = (competitionId: string) =>
  useApi.query<CompetitionDetail>(
    ["arena-competition", competitionId],
    `/arena/competitions/${competitionId}`,
    { enabled: !!competitionId },
  );

export const useJoinCompetition = (competitionId: string) =>
  useApi.mutation<void, { participant: { id: string } }>(
    `/arena/competitions/${competitionId}/join`,
    {
      invalidates: [["arena-competition", competitionId], ["arena-competitions-discover"]],
      toast: { success: "You're in — good luck!" },
    },
  );

export const useMySubmissions = (competitionId: string, joined: boolean) =>
  useApi.query<MySubmissions>(
    ["arena-my-submissions", competitionId],
    `/arena/competitions/${competitionId}/submissions/mine`,
    { orgScoped: false, enabled: !!competitionId && joined },
  );

/**
 * Standings, best submission per participant. Polls only while the caller says
 * the competition is live — a closed leaderboard cannot change without a
 * recompute nobody has run yet, so the interval drops away entirely.
 */
export const useLeaderboard = (competitionId: string, active: boolean) =>
  useApi.query<Leaderboard>(
    ["arena-leaderboard", competitionId],
    `/arena/competitions/${competitionId}/leaderboard`,
    {
      enabled: !!competitionId,
      refetchInterval: active ? 15_000 : undefined,
    },
  );

/** Mints the presigned PUT for a predictions CSV. */
export const useCreateSubmissionUpload = (competitionId: string) =>
  useApi.mutation<{ fileName: string; contentType: string; sizeBytes: number }, SubmissionTicket>(
    `/arena/competitions/${competitionId}/submissions/uploads`,
    {},
  );

/** Marks an uploaded submission accepted — re-checks window and day cap server-side. */
export const useCompleteSubmission = (competitionId: string) =>
  useApi.mutation<{ submissionId: string }, { submission: Submission }>(
    (v) => `/arena/submissions/${v.submissionId}/complete`,
    {
      invalidates: [
        ["arena-my-submissions", competitionId],
        ["arena-leaderboard", competitionId],
      ],
      toast: { success: "Submission received — waiting on scoring." },
    },
  );

/* ------------------------------- the transport ------------------------------ */

/**
 * Sends the CSV to the ticket's URL.
 *
 * Deliberately **not** routed through `@datarango/api` — that client stamps
 * every request with the session JWT and org headers, and the ticket URL is a
 * different origin (R2 / MinIO) that must never see them. The presigned URL
 * carries its own authorisation; Content-Type is the one header allowed, and
 * it must match the ticket exactly or the server deletes the object on
 * completion.
 */
export const putSubmissionToTicket = (
  ticket: SubmissionTicket,
  file: File,
  options: { signal?: AbortSignal } = {},
): Promise<void> =>
  new Promise((resolve, reject) => {
    const xhr = new XMLHttpRequest();
    xhr.open(ticket.method, ticket.uploadUrl, true);
    xhr.setRequestHeader("Content-Type", ticket.contentType);

    xhr.onload = () =>
      xhr.status >= 200 && xhr.status < 300
        ? resolve()
        : reject(
            new Error(
              xhr.status === 403
                ? "The upload link expired. Try again."
                : `Storage refused the upload (HTTP ${xhr.status}).`,
            ),
          );
    xhr.onerror = () => reject(new Error("The upload could not reach storage."));
    xhr.onabort = () => reject(new DOMException("Upload cancelled", "AbortError"));

    options.signal?.addEventListener("abort", () => xhr.abort(), { once: true });
    xhr.send(file);
  });
