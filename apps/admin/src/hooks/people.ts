"use client";

import { useApi } from "@datarango/api";
import type { StaffPermission } from "@datarango/auth";

/**
 * The admin app's people surface (`/staff/*` on the gateway), answered by
 * accounts: the directory of regular users, staff accounts, and staff roles.
 *
 * Staff accounts live apart from user accounts, each with custom roles built
 * from the permission catalog. Accounts re-reads the acting account's
 * permissions on every call; the pages check the same permissions only to
 * explain themselves instead of showing 403s. Nothing here belongs to an org,
 * so every call is `orgScoped: false`.
 */

/** What each catalog permission lets someone do, for the role editor. */
export const PERMISSION_INFO: Record<StaffPermission, { label: string; group: string }> = {
  "users.view": { label: "See the user directory", group: "Users" },
  "users.manage": { label: "Change user accounts", group: "Users" },
  "orgs.view": { label: "See organisations", group: "Organisations" },
  "orgs.manage": { label: "Change organisations", group: "Organisations" },
  "courses.review": { label: "Approve or reject courses", group: "Content" },
  "billing.view": { label: "See billing", group: "Billing" },
  "billing.manage": { label: "Change billing", group: "Billing" },
  "rewards.manage": { label: "Change reward rules", group: "Economy" },
  "notifications.view": { label: "See failed notifications", group: "System" },
  "notifications.manage": { label: "Requeue failed notifications", group: "System" },
  "audit.view": { label: "Read the audit log", group: "System" },
  "flags.manage": { label: "Change feature flags", group: "System" },
  "staff.manage": { label: "Invite and manage staff", group: "Staff" },
  "roles.manage": { label: "Create and edit staff roles", group: "Staff" },
};

export const permissionLabel = (p: string) => PERMISSION_INFO[p as StaffPermission]?.label ?? p;

export interface PlatformUser {
  userId: string;
  email: string;
  displayName: string;
  emailVerified: boolean;
  createdAt: string;
  deactivatedAt: string | null;
}

export interface PlatformUserPage {
  items: PlatformUser[];
  total: number;
  page: number;
  pageSize: number;
}

export type StaffStatus = "active" | "invited" | "deactivated";

export interface StaffRoleRef {
  id: string;
  name: string;
}

export interface StaffAccount {
  id: string;
  email: string;
  displayName: string;
  status: StaffStatus;
  mfaEnabled: boolean;
  createdAt: string;
  lastSignInAt: string | null;
  roles: StaffRoleRef[];
}

export interface StaffRole {
  id: string;
  name: string;
  description: string;
  isSystem: boolean;
  permissions: string[];
  memberCount: number;
}

export interface StaffInvite {
  account: StaffAccount;
  inviteLink: string;
}

const USERS = ["staff-users"];
const ACCOUNTS = ["staff-accounts"];
const ROLES = ["staff-roles"];

export const usePlatformUsers = (
  options: { query?: string; page?: number; pageSize?: number; enabled?: boolean } = {},
) =>
  useApi.query<PlatformUserPage>(
    [...USERS, options.query ?? "", String(options.page ?? 1)],
    "/staff/users",
    {
      orgScoped: false,
      enabled: options.enabled,
      params: { q: options.query || undefined, page: options.page, pageSize: options.pageSize },
    },
  );

export const useStaffAccounts = (enabled = true) =>
  useApi.query<StaffAccount[]>(ACCOUNTS, "/staff/accounts", { orgScoped: false, enabled });

export const useStaffRoles = (enabled = true) =>
  useApi.query<StaffRole[]>(ROLES, "/staff/roles", { orgScoped: false, enabled });

export const usePermissionCatalog = () =>
  useApi.query<string[]>(["staff-permissions"], "/staff/permissions", { orgScoped: false });

export const useInviteStaff = () =>
  useApi.mutation<{ email: string; displayName: string; roleIds: string[] }, StaffInvite>(
    "/staff/accounts",
    { method: "POST", invalidates: [ACCOUNTS, ROLES], toast: { success: "Invite sent" } },
  );

export const useResendInvite = () =>
  useApi.mutation<{ accountId: string }, StaffInvite>(
    (v) => `/staff/accounts/${v.accountId}/resend-invite`,
    { method: "POST", invalidates: [ACCOUNTS], toast: { success: "New invite sent" } },
  );

export const useSetStaffRoles = () =>
  useApi.mutation<{ accountId: string; roleIds: string[] }, StaffAccount>(
    (v) => `/staff/accounts/${v.accountId}/roles`,
    { method: "PUT", invalidates: [ACCOUNTS, ROLES], toast: { success: "Roles saved" } },
  );

export const useSetStaffActive = () =>
  useApi.mutation<{ accountId: string; active: boolean }, StaffAccount>(
    (v) => `/staff/accounts/${v.accountId}/active`,
    { method: "PUT", invalidates: [ACCOUNTS], toast: { success: "Account updated" } },
  );

export const useResetStaffMfa = () =>
  useApi.mutation<{ accountId: string }, StaffAccount>(
    (v) => `/staff/accounts/${v.accountId}/reset-mfa`,
    {
      method: "POST",
      invalidates: [ACCOUNTS],
      toast: { success: "Two-factor reset. They'll set it up again at their next sign-in." },
    },
  );

export const useCreateRole = () =>
  useApi.mutation<{ name: string; description: string; permissions: string[] }, StaffRole>(
    "/staff/roles",
    { method: "POST", invalidates: [ROLES], toast: { success: "Role created" } },
  );

export const useUpdateRole = () =>
  useApi.mutation<
    { roleId: string; name: string; description: string; permissions: string[] },
    StaffRole
  >((v) => `/staff/roles/${v.roleId}`, {
    method: "PUT",
    invalidates: [ROLES, ACCOUNTS],
    toast: { success: "Role saved" },
  });

export const useDeleteRole = () =>
  useApi.mutation<{ roleId: string }, boolean>((v) => `/staff/roles/${v.roleId}`, {
    method: "DELETE",
    invalidates: [ROLES],
    toast: { success: "Role deleted" },
  });
