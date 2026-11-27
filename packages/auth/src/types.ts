/**
 * What a staff account may do in the admin app. Staff accounts are separate
 * from user accounts (their own table and sign-in) and hold custom roles; this
 * is the union of those roles' permissions, from the catalog accounts serves
 * at `/staff/permissions`. A user session's list is always empty.
 *
 * Deliberately kept apart from org permissions so a tenant grant and a staff
 * grant can never be confused; they arrive on separate fields all the way from
 * the RequestContext envelope.
 */
export type StaffPermission =
  | "users.view"
  | "users.manage"
  | "orgs.view"
  | "orgs.manage"
  | "courses.review"
  | "billing.view"
  | "billing.manage"
  | "rewards.manage"
  | "notifications.view"
  | "notifications.manage"
  | "audit.view"
  | "flags.manage"
  | "staff.manage"
  | "roles.manage";

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
  /**
   * The org's subscription is suspended by billing. The gateway freezes the
   * org's routes (403 `org.suspended`) except billing for owners and admins.
   */
  suspended?: boolean;
}

/** The authenticated user held in the session store. */
export interface SessionUser {
  id: string;
  email: string;
  name: string;
  avatarUrl?: string;
  emailVerified: boolean;
  mfaEnabled: boolean;
  /** A staff account signed in to the admin app, not a user. */
  staff: boolean;
  staffPermissions: StaffPermission[];
}

/** Session payload returned by the platform `/me` endpoint. */
export interface SessionPayload {
  user: SessionUser;
  memberships: Membership[];
}

export type SessionStatus = "loading" | "authenticated" | "guest";
