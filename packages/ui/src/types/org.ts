export type OrgRole = "owner" | "admin" | "manager" | "instructor" | "member" | (string & {});

export interface Organization {
  id: string;
  name: string;
  slug: string;
  logoUrl?: string;
  suspended: boolean;
  createdAt: Date;
}

export interface OrgMembership {
  userId: string;
  orgId: string;
  role: OrgRole;
  joinedAt: string;
}

export interface OrgInvite {
  id: string;
  orgId: string;
  email: string;
  role: OrgRole;
  status: "pending" | "accepted" | "expired";
  expiresAt: string;
  createdAt: Date;
}

export interface OrgAssignment {
  id: string;
  orgId: string;
  userId: string;
  courseId: string;
  assignedBy: string;
  activatedAt?: string;
  createdAt: Date;
}
