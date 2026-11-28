"use client";

import { useApi } from "@datarango/api";

/**
 * Organisations, billing and the audit log for the admin app. Each service
 * checks the staff permission on every call; the pages check the same ones
 * to decide what to show, so nobody is offered something that would only
 * come back as a 403. Nothing here belongs to an org, so every call is
 * `orgScoped: false`, and the target org goes in the path.
 */

// ── Organisations (accounts) ─────────────────────────────────────────────────

export interface PlatformOrg {
  id: string;
  name: string;
  slug: string;
  createdAt: string;
  suspendedAt: string | null;
  memberCount: number;
}

export interface PlatformOrgPage {
  items: PlatformOrg[];
  total: number;
  page: number;
  pageSize: number;
}

export interface PlatformOrgMember {
  userId: string;
  email: string | null;
  displayName: string | null;
  role: string;
  joinedAt: string;
  deactivatedAt: string | null;
}

export interface PlatformOrgDetail {
  org: PlatformOrg;
  members: PlatformOrgMember[];
}

const ORGS = ["staff-orgs"];

export const usePlatformOrgs = (
  options: { query?: string; page?: number; pageSize?: number; enabled?: boolean } = {},
) =>
  useApi.query<PlatformOrgPage>(
    [...ORGS, options.query ?? "", String(options.page ?? 1), String(options.pageSize ?? 25)],
    "/staff/orgs",
    {
      orgScoped: false,
      enabled: options.enabled,
      params: { q: options.query || undefined, page: options.page, pageSize: options.pageSize },
    },
  );

export const usePlatformOrg = (orgId: string, enabled = true) =>
  useApi.query<PlatformOrgDetail>([...ORGS, "one", orgId], `/staff/orgs/${orgId}`, {
    orgScoped: false,
    enabled,
  });

export const useSetOrgSuspended = () =>
  useApi.mutation<{ orgId: string; suspended: boolean }, PlatformOrg>(
    (v) => `/staff/orgs/${v.orgId}/suspended`,
    { method: "PUT", invalidates: [ORGS], toast: { success: "Organisation updated" } },
  );

/** Creates an org owned by an existing user; staff can't create the user. */
export const useCreateOrg = () =>
  useApi.mutation<{ name: string; ownerEmail: string }, { id: string; name: string; slug: string }>(
    "/staff/orgs",
    { method: "POST", invalidates: [ORGS], toast: { success: "Organisation created" } },
  );

// ── Billing (economy) ────────────────────────────────────────────────────────

export interface BillingPlan {
  code: string;
  name: string;
  description: string | null;
  audience: string;
  kind: string;
  currency: string;
  unitAmountMinor: number;
  interval: string;
  tier: string | null;
}

export interface OrgSubscription {
  id: string;
  planCode: string;
  planName: string;
  kind: string;
  currency: string;
  unitAmountMinor: number;
  interval: string;
  priceSource: string;
  status: string;
  grantsAccess: boolean;
  licensedSeats: number;
  consumedSeats: number;
  pendingLicensedSeats: number | null;
  currentPeriodStart: string;
  currentPeriodEnd: string;
  cancelAtPeriodEnd: boolean;
}

export interface PriceOverride {
  id: string;
  unitAmountMinor: number;
  standardUnitAmountMinor: number;
  currency: string;
  reason: string;
  endsAt: string;
  createdBy: string;
  createdAt: string;
  revokedAt: string | null;
  revokedBy: string | null;
  active: boolean;
}

export interface BillingAuditEntry {
  id: string;
  actorId: string | null;
  action: string;
  entity: string;
  entityId: string | null;
  reason: string | null;
  createdAt: string;
}

export interface OrgBilling {
  subscription: OrgSubscription | null;
  overrides: PriceOverride[];
  audit: BillingAuditEntry[];
}

const BILLING = ["staff-billing"];

export const useBillingPlans = (enabled = true) =>
  useApi.query<{ plans: BillingPlan[] }>([...BILLING, "plans"], "/staff/billing/plans", {
    orgScoped: false,
    enabled,
    staleTime: 5 * 60_000,
  });

export const useOrgBilling = (orgId: string, enabled = true) =>
  useApi.query<OrgBilling>([...BILLING, orgId], `/staff/billing/orgs/${orgId}`, {
    orgScoped: false,
    enabled,
  });

export const useSubscribeOrg = () =>
  useApi.mutation<{ orgId: string; planCode: string; seats: number }, unknown>(
    (v) => `/staff/billing/orgs/${v.orgId}/subscription`,
    { method: "POST", invalidates: [BILLING], toast: { success: "Subscription started" } },
  );

export const useSetPriceOverride = () =>
  useApi.mutation<
    { orgId: string; unitAmountMinor: number; reason: string; endsAt: string | null },
    { warnings?: string[] }
  >((v) => `/staff/billing/orgs/${v.orgId}/price-override`, {
    method: "PUT",
    invalidates: [BILLING],
    toast: { success: "Negotiated price saved" },
  });

export const useRemovePriceOverride = () =>
  useApi.mutation<{ orgId: string; reason: string }, unknown>(
    (v) => `/staff/billing/orgs/${v.orgId}/price-override/remove`,
    { method: "POST", invalidates: [BILLING], toast: { success: "Negotiated price removed" } },
  );

/** Minor units → "₦12,500.00"-style text in the plan's currency. */
export const formatMoney = (minor: number, currency: string) => {
  try {
    return new Intl.NumberFormat(undefined, { style: "currency", currency }).format(minor / 100);
  } catch {
    return `${(minor / 100).toFixed(2)} ${currency}`;
  }
};

// ── Audit (platform) ─────────────────────────────────────────────────────────

export const AUDIT_CATEGORIES = ["membership", "billing", "accountSecurity", "content"] as const;
export type AuditCategory = (typeof AUDIT_CATEGORIES)[number];

export const auditCategoryLabel: Record<AuditCategory, string> = {
  membership: "Membership",
  billing: "Billing",
  accountSecurity: "Account security",
  content: "Content",
};

export interface AuditEntry {
  id: string;
  orgId: string | null;
  category: AuditCategory;
  action: string;
  summary: string;
  actorId: string | null;
  subjectId: string | null;
  source: string;
  occurredAt: string;
}

export const useAuditLog = (filters: {
  category?: AuditCategory | "";
  orgId?: string;
  before?: string;
  take?: number;
}) =>
  useApi.query<{ entries: AuditEntry[] }>(
    ["staff-audit", filters.category ?? "", filters.orgId ?? "", filters.before ?? ""],
    "/staff/audit",
    {
      orgScoped: false,
      params: {
        category: filters.category || undefined,
        orgId: filters.orgId || undefined,
        before: filters.before || undefined,
        take: filters.take ?? 50,
      },
    },
  );
