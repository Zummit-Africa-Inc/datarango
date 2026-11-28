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

/**
 * One catalog entry as accounts serves it (`GET /staff/permissions`): the
 * `module:feature:action` key, its module, and what holding it lets someone
 * do. The catalog lives in Datarango.Shared; nothing here repeats it.
 */
export interface StaffPermissionInfo {
  key: StaffPermission;
  module: string;
  label: string;
}

/**
 * A segregation-of-duties rule: two permissions nobody but the Super admin may
 * hold together, because between them one person could commit fraud alone.
 * Accounts refuses roles, and role assignments, that would break one.
 */
export interface StaffPermissionConflict {
  id: string;
  first: StaffPermission;
  second: StaffPermission;
  reason: string;
}

export interface PermissionCatalog {
  permissions: StaffPermissionInfo[];
  conflicts: StaffPermissionConflict[];
}

/** The rules that `permissions`, held together, break. */
export const conflictsIn = (
  conflicts: StaffPermissionConflict[],
  permissions: Iterable<string>,
) => {
  const held = new Set(permissions);
  return conflicts.filter((c) => held.has(c.first) && held.has(c.second));
};

/** For each permission, the rule that makes it unavailable alongside `selected`, if any. */
export const blockedBy = (conflicts: StaffPermissionConflict[], selected: Iterable<string>) => {
  const held = new Set(selected);
  const out = new Map<string, StaffPermissionConflict>();
  for (const c of conflicts) {
    if (held.has(c.first) && !held.has(c.second)) out.set(c.second, c);
    if (held.has(c.second) && !held.has(c.first)) out.set(c.first, c);
  }
  return out;
};

/** Headings for the role editor's module groups; unknown modules show as named. */
const MODULE_TITLES: Record<string, string> = {
  platform: "Platform",
  users: "Users",
  orgs: "Organisations",
  creator: "Creator content",
  billing: "Billing",
  rewards: "Rewards",
  notifications: "Notifications",
  audit: "Audit",
  flags: "Feature flags",
  staff: "Staff",
};

export const moduleTitle = (module: string) =>
  MODULE_TITLES[module] ?? module.charAt(0).toUpperCase() + module.slice(1);

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
  createdAt: string;
  lastSignInAt: string | null;
  roles: StaffRoleRef[];
  /** Ids of segregation-of-duties rules their roles break between them (set before the rule existed). */
  conflicts: string[];
}

export interface StaffRole {
  id: string;
  name: string;
  description: string;
  isSystem: boolean;
  permissions: string[];
  memberCount: number;
  /** Ids of segregation-of-duties rules this role breaks (saved before the rule existed). */
  conflicts: string[];
}

/** The account, plus the admin sign-in link the invite email carries. */
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
  useApi.query<PermissionCatalog>(["staff-permissions"], "/staff/permissions", {
    orgScoped: false,
    staleTime: Infinity,
  });

/** Label for a permission key from the catalog, or the key itself while it loads. */
export const usePermissionLabel = () => {
  const { data } = usePermissionCatalog();
  const labels = new Map((data?.permissions ?? []).map((p) => [p.key as string, p.label]));
  return (key: string) => labels.get(key) ?? key;
};

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
