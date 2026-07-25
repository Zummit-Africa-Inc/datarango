/** Platform-level roles carried in the token (BACKEND-HANDOFF §roles). */
export type PlatformRole = "platform_admin" | "platform_staff" | "creator" | "learner";

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
