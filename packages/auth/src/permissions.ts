import type { Membership } from "./types";

/**
 * Org permission catalog — mirrors the backend catalog that custom org roles
 * are built from. Client-side checks are UX gating only; the gateway and
 * services re-validate every request.
 */
export const ORG_PERMISSIONS = [
  "org.members.view",
  "org.members.invite",
  "org.members.manage",
  "org.roles.manage",
  "org.courses.assign",
  "org.reports.view",
  "org.competitions.manage",
  "org.rewards.manage",
  "org.billing.view",
  "org.billing.manage",
  "org.settings.manage",
  "org.grading.grade",
] as const;

export type OrgPermission = (typeof ORG_PERMISSIONS)[number];

const ALL_PERMISSIONS: readonly OrgPermission[] = ORG_PERMISSIONS;

/** Built-in role → permission bundles; the fallback when the server didn't resolve a set. */
export const ORG_ROLE_PERMISSIONS: Record<string, readonly OrgPermission[]> = {
  owner: ALL_PERMISSIONS,
  admin: ALL_PERMISSIONS,
  manager: [
    "org.members.view",
    "org.members.invite",
    "org.courses.assign",
    "org.reports.view",
    "org.competitions.manage",
  ],
  instructor: ["org.reports.view", "org.grading.grade"],
  member: [],
};

/**
 * Resolves the effective permission set for a membership: the server-resolved
 * set wins (covers custom roles); built-in roles fall back to local bundles.
 *
 * @param membership - The membership to resolve, or null for the personal context.
 * @returns The effective permission strings (empty for personal context).
 * @example resolvePermissions({ orgId, orgName, role: "manager" }) // manager bundle
 */
export const resolvePermissions = (membership: Membership | null): readonly string[] => {
  if (!membership) return [];
  return membership.permissions ?? ORG_ROLE_PERMISSIONS[membership.role] ?? [];
};

/**
 * Checks a single permission against a membership's effective set.
 *
 * @param membership - The active membership, or null for personal context.
 * @param permission - Permission string from the org catalog.
 * @returns True when the membership grants the permission.
 * @example hasPermission(active, "org.members.invite")
 */
export const hasPermission = (membership: Membership | null, permission: string): boolean =>
  resolvePermissions(membership).includes(permission);
