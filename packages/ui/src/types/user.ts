export interface User {
  id: string;
  email: string;
  displayName: string;
  avatarUrl?: string;
  emailVerified: boolean;
  platformRoles: ("platform_admin" | "platform_staff" | "creator" | "learner")[];
  createdAt: Date;
  isActive: boolean;
}
