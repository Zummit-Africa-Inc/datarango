"use client";

import { useApi } from "@datarango/api";

/**
 * The org's subscription, seats and invoices.
 *
 * **Org-scoped, unlike the learner wallet hooks.** A subscription belongs to an
 * org or to a person, and which one the server answers with is decided by the
 * `X-Org-Id` header — so these queries must be cached per org or switching org
 * would show one org's seat ledger under another's name. That is the exact case
 * `orgScoped` exists for, and it is left at its default (true) on purpose.
 */

export type SubscriptionStatus = "active" | "pastDue" | "suspended" | "cancelled";
export type PlanKind = "free" | "flat" | "perSeat";
export type PlanAudience = "business" | "consumer";
export type BillingInterval = "monthly" | "yearly";
export type InvoiceStatus = "open" | "paid" | "uncollectible" | "void" | "noCharge";
export type ChargeKind = "base" | "seatProration" | "adjustment";

export interface Plan {
  code: string;
  name: string;
  description: string;
  audience: PlanAudience;
  kind: PlanKind;
  currency: string;
  /** Minor units — kobo for NGN, cents for USD. Never a decimal. */
  unitAmountMinor: number;
  interval: BillingInterval;
}

export interface Subscription {
  id: string;
  planCode: string;
  planName: string;
  kind: PlanKind;
  currency: string;
  unitAmountMinor: number;
  interval: BillingInterval;
  status: SubscriptionStatus;
  /**
   * Whether the subscription currently entitles anybody to anything. Sent by
   * the server rather than derived here, because which statuses grant access is
   * a domain rule (`pastDue` does) and two copies of it would drift.
   */
  grantsAccess: boolean;
  licensedSeats: number;
  consumedSeats: number;
  pendingLicensedSeats: number | null;
  currentPeriodStart: string;
  currentPeriodEnd: string;
  cancelAtPeriodEnd: boolean;
}

export interface SeatHolding {
  userId: string;
  claimedAt: string;
}

export interface SeatLedger {
  licensed: number;
  consumed: number;
  /** Bought and not in use — what a joiner can take at no extra cost. */
  available: number;
  pendingLicensed: number | null;
  renewsOn: string;
  renewalAmountMinor: number;
  currency: string;
  holdings: SeatHolding[];
}

export interface Invoice {
  id: string;
  number: number;
  status: InvoiceStatus;
  currency: string;
  totalMinor: number;
  periodStart: string;
  periodEnd: string;
  dueOn: string;
  issuedAt: string;
  paidAt: string | null;
}

export interface InvoiceLine {
  kind: ChargeKind;
  description: string;
  quantity: number;
  unitAmountMinor: number;
  amountMinor: number;
}

const BILLING = ["org-billing"];

export const usePlans = (audience: PlanAudience = "business") =>
  useApi.query<{ plans: Plan[] }>([...BILLING, "plans", audience], "/economy/billing/plans", {
    // The price book is the same for everyone, so it is the one thing here that
    // does not vary by org.
    orgScoped: false,
    params: { audience },
  });

export const useSubscription = (orgId: string | null) =>
  useApi.query<{ subscription: Subscription | null }>(
    [...BILLING, "subscription"],
    "/economy/billing",
    { enabled: !!orgId },
  );

export const useSeatLedger = (orgId: string | null, enabled = true) =>
  useApi.query<{ seats: SeatLedger | null }>([...BILLING, "seats"], "/economy/billing/seats", {
    enabled: !!orgId && enabled,
  });

export const useInvoices = (orgId: string | null, enabled = true) =>
  useApi.query<{ invoices: Invoice[] }>([...BILLING, "invoices"], "/economy/billing/invoices", {
    enabled: !!orgId && enabled,
  });

export const useInvoice = (invoiceId: string | null) =>
  useApi.query<{ invoice: Invoice; lines: InvoiceLine[] }>(
    [...BILLING, "invoice", invoiceId ?? ""],
    `/economy/billing/invoices/${invoiceId}`,
    { enabled: !!invoiceId },
  );

export const useSubscribe = () =>
  useApi.mutation<{ planCode: string; seats: number }, { subscription: Subscription }>(
    "/economy/billing",
    {
      invalidates: [BILLING],
      toast: { success: "Subscription started." },
    },
  );

/**
 * Changes the licensed seat count.
 *
 * **Never optimistic.** Money is never optimistic anywhere in this codebase,
 * and this one has a second reason: an increase and a decrease do different
 * things (one applies now, one queues for renewal), so a guessed local state
 * would show the wrong one half the time.
 */
export const useSetSeats = () =>
  useApi.mutation<{ seats: number }, { seats: SeatLedger }>("/economy/billing/seats", {
    method: "PUT",
    invalidates: [BILLING],
  });

/** What a customer presses after fixing their card. */
export const usePayInvoice = () =>
  useApi.mutation<{ invoiceId: string }, { invoice: Invoice }>(
    (v) => `/economy/billing/invoices/${v.invoiceId}/pay`,
    {
      invalidates: [BILLING],
      toast: { success: "Payment went through." },
    },
  );

export const useCancelSubscription = () =>
  useApi.mutation<void, { cancelAtPeriodEnd: boolean }>("/economy/billing", {
    method: "DELETE",
    invalidates: [BILLING],
    toast: { success: "Cancelled — access continues to the end of this period." },
  });

/**
 * Formats minor units for display.
 *
 * Divides by 100 exactly once, at the edge, which is the whole reason the wire
 * format is integer minor units: no arithmetic anywhere else in the app can
 * introduce a rounding error, because nothing else ever sees a fraction.
 */
export const formatMoney = (minorUnits: number, currency: string): string => {
  try {
    return new Intl.NumberFormat(undefined, {
      style: "currency",
      currency,
      minimumFractionDigits: 2,
    }).format(minorUnits / 100);
  } catch {
    // An unknown ISO code should degrade to something readable rather than
    // throwing inside a render.
    return `${currency} ${(minorUnits / 100).toFixed(2)}`;
  }
};

export const formatDate = (iso: string): string =>
  new Date(iso).toLocaleDateString(undefined, { year: "numeric", month: "short", day: "numeric" });
