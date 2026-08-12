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
 * Whether the signed-in user's platform grant satisfies `role`.
 *
 * Mirrors the server's `PlatformRoles.Implies`: **admin implies everything**,
 * anything else must match exactly. Without that, a platform admin opening the
 * review queue would be refused by the client while the server would happily
 * serve them — the UI locking out the one person who can do everything.
 *
 * Support is deliberately *not* treated as weaker than reviewer. They are
 * different powers, not a ladder, so there is no ordering to compare.
 *
 * UX gating only — the server re-checks on every call.
 *
 * @example const canReview = usePlatformRole("platform.reviewer");
 */
export const usePlatformRole = (role: PlatformRole): boolean =>
  useSessionStore(
    (s) =>
      s.user?.platformRoles.some((held) => held === "platform.admin" || held === role) ?? false,
  );

/** True for any platform grant at all — the "should this app be usable" check. */
export const useIsPlatformStaff = (): boolean =>
  useSessionStore((s) => (s.user?.platformRoles.length ?? 0) > 0);
