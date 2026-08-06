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
