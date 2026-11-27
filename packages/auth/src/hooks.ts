"use client";

import { useShallow } from "zustand/react/shallow";

import type { Membership, OrgRole, SessionStatus, SessionUser, StaffPermission } from "./types";
import { selectActiveMembership, useSessionStore } from "./store";
import { hasPermission } from "./permissions";

/** Current session status: "loading" until the boot refresh resolves. */
export const useAuthStatus = (): SessionStatus => useSessionStore((s) => s.status);

/** The authenticated user, or null while loading / signed out. */
export const useUser = (): SessionUser | null => useSessionStore((s) => s.user);

/** True once the session is confirmed authenticated. */
export const useIsAuthenticated = (): boolean =>
  useSessionStore((s) => s.status === "authenticated");

/** All org memberships for the signed-in user. */
export const useMemberships = (): Membership[] => useSessionStore((s) => s.memberships);

/**
 * The active org context: id, membership record, and the switcher action.
 *
 * @returns Stable object — safe to destructure.
 * @example const { activeOrgId, membership, setOrgContext } = useActiveOrg();
 */
export const useActiveOrg = () =>
  useSessionStore(
    useShallow((s) => ({
      activeOrgId: s.activeOrgId,
      membership: selectActiveMembership(s),
      setOrgContext: s.setOrgContext,
    })),
  );

/**
 * Checks one org permission against the active context. Personal context
 * grants nothing. UX gating only — the gateway re-validates.
 *
 * @param permission - Permission string from the org catalog.
 * @example const canInvite = usePermission("org.members.invite");
 */
export const usePermission = (permission: string): boolean =>
  useSessionStore((s) => hasPermission(selectActiveMembership(s), permission));

/** The role held in the active org context, or null in personal context. */
export const useOrgRole = (): OrgRole | null =>
  useSessionStore((s) => selectActiveMembership(s)?.role ?? null);

/**
 * Whether the signed-in staff account holds `permission`. Always false for a
 * user session. UX gating only — accounts and the services re-check every call.
 *
 * @example const canReview = useStaffPermission("creator:courses:approve");
 */
export const useStaffPermission = (permission: StaffPermission): boolean =>
  useSessionStore(
    (s) => (s.user?.staff ?? false) && (s.user?.staffPermissions ?? []).includes(permission),
  );

/** True for a staff account session — the "should this app be usable" check. */
export const useIsStaff = (): boolean => useSessionStore((s) => s.user?.staff ?? false);
