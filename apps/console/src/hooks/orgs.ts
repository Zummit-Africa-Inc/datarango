"use client";

import { useApi } from "@datarango/api";

/** One org the caller belongs to (mirrors accounts' OrgSummary). */
export interface OrgSummary {
  id: string;
  name: string;
  slug: string;
  role: string;
}

/**
 * A member row (mirrors accounts' `OrgMemberView`).
 *
 * `displayName`/`email` are resolved from identity through `IUserDirectory`
 * *after* the `org.members.view` gate, and only for ids that came out of this
 * org's memberships — so this is never a way to probe for users outside it.
 * Both are null when identity has no such user, which the UI renders as the
 * short id rather than inventing a name.
 */
export interface OrgMember {
  userId: string;
  role: string;
  joinedAt: string;
  active: boolean;
  displayName: string | null;
  email: string | null;
}

/** How to name a member in the UI, falling back to a short id. */
export const memberLabel = (member: OrgMember) =>
  member.displayName?.trim() || member.email || `${member.userId.slice(0, 8)}…`;

/** A role in the catalog (built-in or custom) with its permission set. */
export interface OrgRole {
  id: string;
  name: string;
  permissions: string[];
  builtIn: boolean;
}

export interface InviteInfo {
  id: string;
  email: string;
  role: string;
  token: string;
  expiresAt: string;
}

/** The orgs the signed-in user belongs to (user-scoped — not org-scoped cache). */
export const useMyOrgs = () => useApi.query<OrgSummary[]>(["orgs"], "/orgs", { orgScoped: false });

export const useCreateOrg = () =>
  useApi.mutation<{ name: string }, OrgSummary>("/orgs", {
    invalidates: [["orgs"]],
    toast: { success: "Organization created" },
  });

export const useOrgMembers = (orgId: string | null) =>
  useApi.query<OrgMember[]>(["org-members", orgId ?? ""], `/orgs/${orgId}/members`, {
    enabled: !!orgId,
  });

export const useOrgRoles = (orgId: string | null) =>
  useApi.query<OrgRole[]>(["org-roles", orgId ?? ""], `/orgs/${orgId}/roles`, {
    enabled: !!orgId,
  });

/**
 * The permission catalog — every permission a custom role can be built from.
 *
 * Fetched rather than hardcoded on purpose. `OrgPermissions.All` is the single
 * source of truth server-side, and a duplicated frontend list silently stops
 * offering whatever gets added to it next. The catalog is identical for every
 * caller, so this is not org-scoped.
 */
export const useOrgPermissionCatalog = () =>
  useApi.query<{ permissions: string[] }>(["org-permission-catalog"], "/orgs/permissions", {
    orgScoped: false,
    // It changes only when the platform ships a new permission.
    staleTime: 60 * 60 * 1000,
  });

export interface RoleInput {
  name: string;
  permissions: string[];
}

export const useCreateRole = (orgId: string) =>
  useApi.mutation<RoleInput, OrgRole>(`/orgs/${orgId}/roles`, {
    invalidates: [["org-roles", orgId]],
    toast: { success: "Role created" },
  });

/** Set-only: the permission list sent replaces the stored one wholesale. */
export const useUpdateRole = (orgId: string) =>
  useApi.mutation<RoleInput & { roleId: string }, OrgRole>(
    (v) => `/orgs/${orgId}/roles/${v.roleId}`,
    { method: "PUT", invalidates: [["org-roles", orgId]], toast: { success: "Role updated" } },
  );

/**
 * Deleting a role is **refused while anyone still holds it**
 * (`org.role_in_use` — "Reassign members off this role before deleting it"), so
 * the screen disables the control and says why rather than offering a click the
 * server will reject. That refusal is the right one: a membership resolves by
 * role *name*, so deleting a role out from under its holders would leave them
 * on a name that resolves to no permissions at all.
 */
export const useDeleteRole = (orgId: string) =>
  useApi.mutation<{ roleId: string }, unknown>((v) => `/orgs/${orgId}/roles/${v.roleId}`, {
    method: "DELETE",
    invalidates: [
      ["org-roles", orgId],
      ["org-members", orgId],
    ],
    toast: { success: "Role deleted" },
  });

/**
 * Human-readable labels for the catalog.
 *
 * Deliberately a lookup with a **fallback that derives from the string**, not an
 * exhaustive `Record`: a new server-side permission must render as something
 * readable the day it ships, not as a blank row or a type error.
 */
const PERMISSION_LABELS: Record<string, string> = {
  "org.members.view": "View members",
  "org.members.invite": "Invite members",
  "org.members.manage": "Manage members",
  "org.roles.manage": "Manage roles",
  "org.courses.assign": "Assign courses",
  "org.reports.view": "View progress reports",
  "org.competitions.manage": "Run competitions",
  "org.rewards.manage": "Manage rewards",
  "org.billing.view": "View billing",
  "org.billing.manage": "Manage billing",
  "org.settings.manage": "Manage settings",
  "org.grading.grade": "Grade submissions",
};

export const permissionLabel = (permission: string) =>
  PERMISSION_LABELS[permission] ??
  permission
    .replace(/^org\./, "")
    .replace(/\./g, " ")
    .replace(/^./, (c) => c.toUpperCase());

/** The group a permission belongs to, taken from its own namespace. */
export const permissionGroup = (permission: string) => permission.split(".")[1] ?? "other";

export const useInviteMember = (orgId: string) =>
  useApi.mutation<{ email: string; role: string }, InviteInfo>(`/orgs/${orgId}/invites`, {
    invalidates: [["org-members", orgId]],
    toast: { success: "Invitation sent" },
  });

export const useChangeMemberRole = (orgId: string) =>
  useApi.mutation<{ targetUserId: string; role: string }, OrgMember>(
    (v) => `/orgs/${orgId}/members/${v.targetUserId}/role`,
    { method: "PUT", invalidates: [["org-members", orgId]], toast: { success: "Role updated" } },
  );

export const useDeactivateMember = (orgId: string) =>
  useApi.mutation<{ targetUserId: string }, unknown>(
    (v) => `/orgs/${orgId}/members/${v.targetUserId}`,
    {
      method: "DELETE",
      invalidates: [["org-members", orgId]],
      toast: { success: "Member removed" },
    },
  );
