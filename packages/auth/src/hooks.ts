"use client";

import { useShallow } from "zustand/react/shallow";

import type { Membership, OrgRole, PlatformRole, SessionStatus, SessionUser } from "./types";
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
 * Checks a platform-level role on the signed-in user.
 *
 * @param role - Platform role to check.
 * @example const isCreator = usePlatformRole("creator");
 */
export const usePlatformRole = (role: PlatformRole): boolean =>
  useSessionStore((s) => s.user?.platformRoles.includes(role) ?? false);
