"use client";

import { useEffect, useMemo } from "react";
import { usePathname } from "next/navigation";

import {
  createAuthClient,
  hasPermission,
  useActiveOrg,
  useAuthStatus,
  useUser,
} from "@datarango/auth";
import { AppShell, Loader, ORG_NAV, OrgSwitcher, filterNav, type Tenant } from "@datarango/ui";

import { CreateFirstOrg } from "@/components/create-first-org";
import { SuspendedOrgGate } from "@/components/suspended-org";
import { useMyOrgs } from "@/hooks/orgs";

const auth = createAuthClient();

const ROLE_LABELS: Record<string, string> = {
  owner: "Owner",
  admin: "Org admin",
  manager: "Manager",
  instructor: "Instructor",
  member: "Member",
};

/**
 * Org-admin shell. Every hook runs before the first early return: hooks after a
 * conditional return change the hook order when the auth status flips, which
 * React reports as a crash ("This page couldn't load").
 */
export default function OrgLayout({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const status = useAuthStatus();
  const user = useUser();
  const { activeOrgId, membership, setOrgContext } = useActiveOrg();
  const { data: orgs, isLoading } = useMyOrgs({ enabled: status === "authenticated" });

  useEffect(() => {
    if (status === "guest") {
      window.location.assign(`/api/auth/signin?returnTo=${encodeURIComponent(pathname)}`);
    }
  }, [status, pathname]);

  const tenants: Tenant[] = useMemo(
    () => (orgs ?? []).map((o) => ({ id: o.id, name: o.name, slug: o.slug })),
    [orgs],
  );

  // Land on the first org when nothing (or a stale org) is selected.
  useEffect(() => {
    if (!orgs || orgs.length === 0) return;
    if (!activeOrgId || !orgs.some((o) => o.id === activeOrgId)) {
      setOrgContext(orgs[0]!.id);
    }
  }, [orgs, activeOrgId, setOrgContext]);

  const nav = useMemo(
    () => filterNav(ORG_NAV, (permission) => hasPermission(membership, permission)),
    [membership],
  );

  if (status !== "authenticated" || isLoading || !orgs) {
    return <Loader />;
  }

  if (orgs.length === 0) {
    return <CreateFirstOrg />;
  }

  const activeTenant = tenants.find((t) => t.id === activeOrgId) ?? tenants[0]!;

  return (
    <AppShell
      nav={nav}
      homeHref="/overview"
      product="Console"
      orgSwitcher={(collapsed) => (
        <OrgSwitcher
          collapsed={collapsed}
          current={activeTenant}
          tenants={tenants}
          onChange={(t) => setOrgContext(t.id)}
        />
      )}
      overviewPaths={["/overview"]}
      greeting={{ title: activeTenant.name, subtitle: "Organisation dashboard" }}
      searchPlaceholder="Search console…"
      user={{
        name: user?.name ?? "…",
        email: user?.email ?? "",
        avatarUrl: user?.avatarUrl,
        role: membership ? (ROLE_LABELS[membership.role] ?? membership.role) : undefined,
      }}
      onSignOut={() => auth.signOut()}
    >
      <SuspendedOrgGate>{children}</SuspendedOrgGate>
    </AppShell>
  );
}
