export interface WalletBalance {
  userId: string;
  balance: number;
  currency: string;
}

export type LedgerEntryType = "credit" | "debit";

export interface LedgerEntry {
  id: string;
  type: LedgerEntryType;
  amount: number;
  description: string;
  eventType?: string;
  createdAt: Date;
}

export interface AchievementBadge {
  id: string;
  key: string;
  name: string;
  description: string;
  iconUrl?: string;
  awardedAt: string;
}

export interface GamificationProfile {
  userId: string;
  xp: number;
  level: number;
  streakDays: number;
  badges: AchievementBadge[];
}

export interface GamificationLeaderboardEntry {
  rank: number;
  userId: string;
  displayName: string;
  avatarUrl?: string;
  xp: number;
  streakDays: number;
}

export interface Invoice {
  id: string;
  orgId: string;
  cycleStart: string;
  cycleEnd: string;
  totalAmount: number;
  currency: string;
  status: "draft" | "issued" | "paid" | "overdue" | "void";
  issuedAt?: string;
  paidAt?: string;
  pdfUrl?: string;
}

export interface UsageRecord {
  id: string;
  orgId: string;
  userId: string;
  courseId: string;
  unitPrice: number;
  currency: string;
  occurredAt: string;
  cycle: string;
}
