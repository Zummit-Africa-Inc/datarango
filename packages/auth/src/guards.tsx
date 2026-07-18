"use client";

import { usePathname, useRouter } from "next/navigation";
import { useEffect, type ReactNode } from "react";

import type { OrgRole } from "./types";
import { useAuthStatus, useOrgRole, usePermission } from "./hooks";

const redirect = (router: ReturnType<typeof useRouter>, to: string, returnTo: string) => {
  const target = `${to}${to.includes("?") ? "&" : "?"}returnTo=${encodeURIComponent(returnTo)}`;
  if (to.startsWith("http")) window.location.assign(target);
  else router.replace(target);
};

interface AuthGuardProps {
  children: ReactNode;
  /** Rendered while the session is loading (and briefly before a redirect). */
  fallback?: ReactNode;
  /** Sign-in location; absolute URLs supported for apps that host no auth UI. */
  redirectTo?: string;
}

/**
 * Client route guard: renders children only for authenticated sessions,
 * redirecting guests to sign-in with a returnTo. Pair with the middleware
 * helper — middleware gates optimistically at the edge, this is the
 * client-side truth once the session resolves.
 *
 * @example
 * <AuthGuard fallback={<PageSkeleton />}><Dashboard /></AuthGuard>
 */
export const AuthGuard = ({ children, fallback = null, redirectTo = "/signin" }: AuthGuardProps) => {
  const status = useAuthStatus();
  const router = useRouter();
  const pathname = usePathname();

  useEffect(() => {
    if (status === "guest") redirect(router, redirectTo, pathname);
  }, [status, router, redirectTo, pathname]);

  if (status !== "authenticated") return fallback;
  return children;
};

interface PermissionGuardProps {
  children: ReactNode;
  /** Permission from the org catalog required to render children. */
  permission: string;
  /** Rendered when the permission is missing (default: nothing). */
  fallback?: ReactNode;
}

/**
 * Renders children only when the active org context grants the permission.
 * UX gating only — the gateway re-validates every request.
 *
 * @example
 * <PermissionGuard permission="org.members.invite"><InviteButton /></PermissionGuard>
 */
export const PermissionGuard = ({ children, permission, fallback = null }: PermissionGuardProps) => {
  const allowed = usePermission(permission);
  return allowed ? children : fallback;
};

interface OrgRoleGuardProps {
  children: ReactNode;
  /** Org roles (built-in or custom) allowed to see children. */
  roles: OrgRole[];
  fallback?: ReactNode;
}

/**
 * Renders children only when the active org role is one of `roles`.
 *
 * @example
 * <OrgRoleGuard roles={["owner", "admin"]}><BillingSettings /></OrgRoleGuard>
 */
export const OrgRoleGuard = ({ children, roles, fallback = null }: OrgRoleGuardProps) => {
  const role = useOrgRole();
  return role !== null && roles.includes(role) ? children : fallback;
};

/**
 * Hook form of the auth guard for pages that need imperative control:
 * redirects guests and reports whether the session is ready to render.
 *
 * @param redirectTo - Sign-in location (absolute URLs supported).
 * @returns True once authenticated; false while loading or redirecting.
 * @example const ready = useRequireAuth(); if (!ready) return <Skeleton />;
 */
export const useRequireAuth = (redirectTo = "/signin"): boolean => {
  const status = useAuthStatus();
  const router = useRouter();
  const pathname = usePathname();

  useEffect(() => {
    if (status === "guest") redirect(router, redirectTo, pathname);
  }, [status, router, redirectTo, pathname]);

  return status === "authenticated";
};
