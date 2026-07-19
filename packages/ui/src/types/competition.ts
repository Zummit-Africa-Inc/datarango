export type CompetitionStatus = "draft" | "open" | "closed" | "archived";

export interface Competition {
  id: string;
  title: string;
  slug: string;
  description: string;
  coverUrl?: string;
  status: CompetitionStatus;
  metric: string;
  submissionLimitPerDay: number;
  startsAt: string;
  endsAt: string;
  orgId?: string;
  datasetIds: string[];
  createdAt: Date;
}

export interface CompetitionSubmission {
  id: string;
  competitionId: string;
  userId: string;
  status: "pending" | "validating" | "scoring" | "scored" | "failed";
  publicScore?: number;
  privateScore?: number;
  submittedAt: string;
  scoredAt?: string;
}

export interface CompetitionLeaderboardEntry {
  rank: number;
  userId: string;
  displayName: string;
  avatarUrl?: string;
  score: number;
  submissionCount: number;
  lastSubmittedAt: string;
}
