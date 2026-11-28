/**
 * What a staff account may do in the admin app. Staff accounts are separate
 * from user accounts (their own table and sign-in) and hold custom roles; this
 * is the union of those roles' permissions, from the catalog accounts serves
 * at `/staff/permissions`. A user session's list is always empty.
 *
 * Deliberately kept apart from org permissions so a tenant grant and a staff
 * grant can never be confused; they arrive on separate fields all the way from
 * the RequestContext envelope.
 *
 * Keys are `module:feature:action` and mirror `StaffPermissions` in
 * Datarango.Shared; labels come from the catalog, not from here.
 */
export type StaffPermission =
  | "platform:overview:view"
  | "users:accounts:view"
  | "users:accounts:manage"
  | "orgs:organizations:view"
  | "orgs:organizations:manage"
  | "creator:courses:view"
  | "creator:courses:approve"
  | "billing:organization:view"
  | "billing:organization:manage"
  | "billing:pricing:override"
  | "rewards:rules:view"
  | "rewards:rules:manage"
  | "notifications:deliveries:view"
  | "notifications:deliveries:retry"
  | "audit:events:view"
  | "flags:features:view"
  | "flags:features:manage"
  | "staff:accounts:view"
  | "staff:accounts:manage"
  | "staff:roles:view"
  | "staff:roles:manage";

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
