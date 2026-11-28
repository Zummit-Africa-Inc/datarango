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

/** What Datarango knows about a customer. Every field is optional. */
export interface OrgProfile {
  website: string | null;
  industry: string | null;
  /** Head-count band, e.g. "11-50". */
  size: string | null;
  /** ISO 3166-1 alpha-2. */
  country: string | null;
  billingEmail: string | null;
  phone: string | null;
  address: string | null;
  taxId: string | null;
  /** Staff only; never shown to the organisation. */
  notes: string | null;
}

export const EMPTY_PROFILE: OrgProfile = {
  website: null,
  industry: null,
  size: null,
  country: null,
  billingEmail: null,
  phone: null,
  address: null,
  taxId: null,
  notes: null,
};

export const ORG_SIZES = ["1-10", "11-50", "51-200", "201-500", "501-1000", "1000+"] as const;

export const INDUSTRIES = [
  "Education",
  "Technology",
  "Financial services",
  "Healthcare",
  "Government",
  "Non-profit",
  "Retail",
  "Manufacturing",
  "Media",
  "Other",
] as const;

export interface PlatformOrg {
  id: string;
  name: string;
  slug: string;
  createdAt: string;
  suspendedAt: string | null;
  memberCount: number;
  profile: OrgProfile;
  /** Whether members see Datarango's own catalogue as well as the org's courses. */
  allowPlatformCourses: boolean;
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
  options: {
    query?: string;
    page?: number;
    pageSize?: number;
    /** Only these orgs (up to 100), e.g. to name the rows of another list. */
    ids?: string[];
    enabled?: boolean;
  } = {},
) =>
  useApi.query<PlatformOrgPage>(
    [
      ...ORGS,
      options.query ?? "",
      String(options.page ?? 1),
      String(options.pageSize ?? 25),
      options.ids?.join(",") ?? "",
    ],
    "/staff/orgs",
    {
      orgScoped: false,
      enabled: options.enabled,
      params: {
        q: options.query || undefined,
        ids: options.ids?.length ? options.ids.join(",") : undefined,
        page: options.page,
        pageSize: options.pageSize,
      },
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
  useApi.mutation<
    { name: string; ownerEmail: string; profile: OrgProfile; allowPlatformCourses: boolean },
    { id: string; name: string; slug: string }
  >("/staff/orgs", { method: "POST", invalidates: [ORGS] });

export const useUpdateOrg = () =>
  useApi.mutation<
    { orgId: string; profile: OrgProfile; allowPlatformCourses: boolean },
    PlatformOrg
  >((v) => `/staff/orgs/${v.orgId}`, {
    method: "PUT",
    invalidates: [ORGS],
    toast: { success: "Organisation saved" },
  });

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

export const useSubscribeOrg = (options: { silent?: boolean } = {}) =>
  useApi.mutation<{ orgId: string; planCode: string; seats: number }, unknown>(
    (v) => `/staff/billing/orgs/${v.orgId}/subscription`,
    {
      method: "POST",
      invalidates: [BILLING],
      toast: options.silent ? undefined : { success: "Subscription started" },
    },
  );

// ── Price book (economy) ─────────────────────────────────────────────────────

export type PlanAudience = "business" | "consumer";
export type PlanKind = "free" | "flat" | "perSeat";
export type PlanTier = "free" | "individual" | "student" | "teams" | "enterprise" | "legacy";
export type PlanInterval = "monthly" | "yearly";

export interface PriceBookPlan {
  id: string;
  code: string;
  name: string;
  description: string;
  audience: PlanAudience;
  kind: PlanKind;
  tier: PlanTier;
  interval: PlanInterval;
  currency: string;
  unitAmountMinor: number;
  enabled: boolean;
  effectiveFrom: string;
  effectiveTo: string | null;
  onSale: boolean;
  /** Live (not cancelled) subscriptions on this exact price row. */
  subscribers: number;
}

export interface PriceBookBand {
  id: string;
  code: string;
  currency: string;
  minSeats: number;
  maxSeats: number | null;
  unitAmountMinor: number | null;
  floorAmountMinor: number | null;
  effectiveFrom: string;
  effectiveTo: string | null;
}

export interface PriceBookChange {
  id: string;
  actorId: string;
  action: string;
  entity: string;
  before: string | null;
  after: string | null;
  reason: string;
  createdAt: string;
}

export interface PriceBook {
  plans: PriceBookPlan[];
  bands: PriceBookBand[];
  history: PriceBookChange[];
}

const PRICE_BOOK = [...BILLING, "price-book"];

export const usePriceBook = (enabled = true) =>
  useApi.query<PriceBook>(PRICE_BOOK, "/staff/billing/price-book", { orgScoped: false, enabled });

export const usePublishPlan = () =>
  useApi.mutation<
    {
      code: string;
      name: string;
      description: string | null;
      audience: PlanAudience;
      kind: PlanKind;
      tier: PlanTier;
      interval: PlanInterval;
      currency: string;
      unitAmountMinor: number;
      reason: string;
    },
    unknown
  >("/staff/billing/plans", {
    method: "POST",
    invalidates: [BILLING],
    toast: { success: "Plan published" },
  });

export const useRepricePlan = () =>
  useApi.mutation<
    {
      code: string;
      newCode: string;
      unitAmountMinor: number;
      name: string | null;
      description: string | null;
      reason: string;
    },
    unknown
  >((v) => `/staff/billing/plans/${v.code}/reprice`, {
    method: "POST",
    invalidates: [BILLING],
    toast: { success: "New price published" },
  });

export const useSetPlanEnabled = () =>
  useApi.mutation<{ code: string; enabled: boolean; reason: string }, unknown>(
    (v) => `/staff/billing/plans/${v.code}/enabled`,
    { method: "PUT", invalidates: [BILLING], toast: { success: "Plan updated" } },
  );

export const useRepriceBand = () =>
  useApi.mutation<
    {
      bandId: string;
      unitAmountMinor: number | null;
      floorAmountMinor: number | null;
      reason: string;
    },
    unknown
  >((v) => `/staff/billing/bands/${v.bandId}/reprice`, {
    method: "POST",
    invalidates: [BILLING],
    toast: { success: "Seat band repriced" },
  });

// ── Subscriptions (economy) ──────────────────────────────────────────────────

export type SubscriptionStatus = "active" | "pastDue" | "suspended" | "cancelled";

export const SUBSCRIPTION_STATUS_LABEL: Record<SubscriptionStatus, string> = {
  active: "Active",
  pastDue: "Past due",
  suspended: "Suspended",
  cancelled: "Cancelled",
};

export interface StaffSubscription {
  id: string;
  orgId: string | null;
  userId: string | null;
  planCode: string;
  planName: string;
  tier: PlanTier;
  interval: PlanInterval;
  currency: string;
  unitAmountMinor: number;
  priceSource: string;
  status: SubscriptionStatus;
  grantsAccess: boolean;
  licensedSeats: number;
  consumedSeats: number;
  startedAt: string;
  currentPeriodStart: string;
  currentPeriodEnd: string;
  cancelAtPeriodEnd: boolean;
}

export interface StaffSubscriptionPage {
  items: StaffSubscription[];
  total: number;
  page: number;
  pageSize: number;
}

export const useStaffSubscriptions = (filters: {
  audience?: PlanAudience | "";
  status?: SubscriptionStatus | "";
  plan?: string;
  page?: number;
  pageSize?: number;
}) =>
  useApi.query<StaffSubscriptionPage>(
    [
      ...BILLING,
      "subscriptions",
      filters.audience ?? "",
      filters.status ?? "",
      filters.plan ?? "",
      String(filters.page ?? 1),
    ],
    "/staff/billing/subscriptions",
    {
      orgScoped: false,
      params: {
        audience: filters.audience || undefined,
        status: filters.status || undefined,
        plan: filters.plan || undefined,
        page: filters.page,
        pageSize: filters.pageSize ?? 25,
      },
    },
  );

/** Major units typed into a form → minor units, or null when it isn't a price. */
export const toMinor = (major: string) => {
  const value = Number.parseFloat(major);
  return Number.isFinite(value) && value >= 0 ? Math.round(value * 100) : null;
};

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
