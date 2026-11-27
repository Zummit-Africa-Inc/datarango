"use client";

import { useApi } from "@datarango/api";

/**
 * The platform people surface (`/platform/users`, `/platform/staff`), answered
 * by accounts.
 *
 * Authority is the platform role accounts reads from its own table: admin or
 * support for the directory, admin for the staff list and every grant. The
 * page checks the same roles only to explain itself instead of showing 403s.
 * Nothing here belongs to an org, so every call is `orgScoped: false`.
 */

export type StaffRole = "platform.admin" | "platform.reviewer" | "platform.support";

export const STAFF_ROLES: { value: StaffRole; label: string; description: string }[] = [
  {
    value: "platform.reviewer",
    label: "Reviewer",
    description: "Reviews and approves creator courses.",
  },
  {
    value: "platform.support",
    label: "Support",
    description: "Read-only: users, failed notifications.",
  },
  {
    value: "platform.admin",
    label: "Admin",
    description: "Everything, including granting staff roles.",
  },
];

export const roleLabel = (role: string | null | undefined) =>
  STAFF_ROLES.find((r) => r.value === role)?.label ?? role ?? "";

export interface PlatformUser {
  userId: string;
  email: string;
  displayName: string;
  emailVerified: boolean;
  createdAt: string;
  deactivatedAt: string | null;
  platformRole: StaffRole | null;
}

export interface PlatformUserPage {
  items: PlatformUser[];
  total: number;
  page: number;
  pageSize: number;
}

export interface StaffMember {
  userId: string;
  email: string;
  displayName: string;
  role: StaffRole;
  grantedAt: string;
}

const USERS = ["platform-users"];
const STAFF = ["platform-staff"];

export const usePlatformUsers = (
  options: { query?: string; page?: number; pageSize?: number; enabled?: boolean } = {},
) =>
  useApi.query<PlatformUserPage>(
    [...USERS, options.query ?? "", String(options.page ?? 1)],
    "/platform/users",
    {
      orgScoped: false,
      enabled: options.enabled,
      params: { q: options.query || undefined, page: options.page, pageSize: options.pageSize },
    },
  );

export const useStaff = (enabled = true) =>
  useApi.query<StaffMember[]>(STAFF, "/platform/staff", { orgScoped: false, enabled });

/** Grants a role, or changes the one already held. Keyed on email, as accounts is. */
export const useGrantStaff = () =>
  useApi.mutation<{ email: string; role: StaffRole }, StaffMember>("/platform/staff", {
    method: "PUT",
    invalidates: [STAFF, USERS],
    toast: { success: "Role saved" },
  });

export const useRevokeStaff = () =>
  useApi.mutation<{ userId: string }, boolean>((v) => `/platform/staff/${v.userId}`, {
    method: "DELETE",
    invalidates: [STAFF, USERS],
    toast: { success: "Staff access removed" },
  });
