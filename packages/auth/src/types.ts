/**
 * Platform-level authority, held by a person rather than granted inside a org.
 *
 * These are the values accounts actually stores and `/me` actually returns.
 * They were previously guessed from the handoff as
 * `platform_admin | platform_staff | creator | learner`, none of which exist:
 * the catalog is reviewer/admin/support, and `learner` was never a platform
 * role — every user is implicitly one, so an ordinary user's array is **empty**.
 *
 * Deliberately kept apart from org permissions so a tenant grant and a platform
 * grant can never be confused; they arrive on separate fields all the way from
 * the RequestContext envelope.
 */
export type PlatformRole = "platform.reviewer" | "platform.admin" | "platform.support";

/** Built-in org roles; custom org roles arrive as arbitrary strings with server-resolved permissions. */
export type OrgRole = "owner" | "admin" | "manager" | "instructor" | "member" | (string & {});

/**
 * One org membership as returned by the session endpoint. `permissions` is the
 * gateway-resolved effective set — present for custom roles, optional for
 * built-ins (which fall back to the local role bundles).
 */
export interface Membership {
  orgId: string;
  orgName: string;
  role: OrgRole;
  permissions?: string[];
}

/** The authenticated user held in the session store. */
export interface SessionUser {
  id: string;
  email: string;
  name: string;
  avatarUrl?: string;
  emailVerified: boolean;
  mfaEnabled: boolean;
  platformRoles: PlatformRole[];
}

/** Session payload returned by the platform `/me` endpoint. */
export interface SessionPayload {
  user: SessionUser;
  memberships: Membership[];
}

export type SessionStatus = "loading" | "authenticated" | "guest";
