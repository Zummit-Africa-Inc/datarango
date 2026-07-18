/**
 * @datarango/auth — session store, permission resolver, route guards and the
 * browser auth client (FRONTEND-HANDOFF §2). Server-only pieces ship from
 * subpaths: `@datarango/auth/middleware` (edge) and `@datarango/auth/server`
 * (BFF route handlers).
 */
export type {
  Membership,
  OrgRole,
  PlatformRole,
  SessionPayload,
  SessionStatus,
  SessionUser,
} from "./types";
export {
  ORG_PERMISSIONS,
  ORG_ROLE_PERMISSIONS,
  hasPermission,
  resolvePermissions,
} from "./permissions";
export type { OrgPermission } from "./permissions";
export { tokenStore } from "./token";
export { selectActiveMembership, useSessionStore } from "./store";
export {
  useActiveOrg,
  useAuthStatus,
  useIsAuthenticated,
  useMemberships,
  useOrgRole,
  usePermission,
  usePlatformRole,
  useUser,
} from "./hooks";
export { AuthGuard, OrgRoleGuard, PermissionGuard, useRequireAuth } from "./guards";
export { SessionProvider } from "./session-provider";
export { createAuthClient } from "./client";
export type { AuthClient } from "./client";
export { createPkcePair, randomState } from "./pkce";
