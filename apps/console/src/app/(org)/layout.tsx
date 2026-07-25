"use client";

import { useEffect, useMemo, useState } from "react";
import { usePathname } from "next/navigation";

import { createAuthClient, useActiveOrg, useAuthStatus, useUser } from "@datarango/auth";
import {
  CompanySwitcher,
  ContextSwitcher,
  Header,
  Loader,
  Sidebar,
  type Tenant,
} from "@datarango/ui";

import { CreateFirstOrg } from "@/components/create-first-org";
import { useMyOrgs } from "@/hooks/orgs";
import { ORG_ROUTES } from "@/config/routes";

const auth = createAuthClient();

export default function OrgLayout({ children }: { children: React.ReactNode }) {
  const [collapsed, setCollapsed] = useState(false);
  const [search, setSearch] = useState("");

  const pathname = usePathname();
  const status = useAuthStatus();
  const user = useUser();
  const { activeOrgId, setOrgContext } = useActiveOrg();
  const { data: orgs, isLoading } = useMyOrgs();

  // No session → hand off to the BFF sign-in, which completes via the shared SSO
  // cookie (already set if the user signed into any Datarango app) — no re-login.
  useEffect(() => {
    if (status === "guest") {
      window.location.assign(`/api/auth/signin?returnTo=${encodeURIComponent(pathname)}`);
    }
  }, [status, pathname]);

  if (status !== "authenticated") {
    return <Loader />;
  }

  const tenants: Tenant[] = useMemo(
    () => (orgs ?? []).map((o) => ({ id: o.id, name: o.name, slug: o.slug })),
    [orgs],
  );

  // Default the active org to the first membership once orgs load.
  useEffect(() => {
    if (!orgs || orgs.length === 0) return;
    if (!activeOrgId || !orgs.some((o) => o.id === activeOrgId)) {
      setOrgContext(orgs[0]!.id);
    }
  }, [orgs, activeOrgId, setOrgContext]);

  if (isLoading || !orgs) {
    return <Loader />;
  }

  if (orgs.length === 0) {
    return <CreateFirstOrg />;
  }

  const activeTenant = tenants.find((t) => t.id === activeOrgId) ?? tenants[0]!;

  return (
    <div className="flex h-screen">
      <Sidebar
        collapsed={collapsed}
        logoHref="/overview"
        routes={ORG_ROUTES}
        top={
          <CompanySwitcher
            collapsed={collapsed}
            currentTenant={activeTenant}
            onTenantChange={(t) => setOrgContext(t.id)}
            tenants={tenants}
          />
        }
        footer={
          <ContextSwitcher
            onSignOut={() => auth.signOut()}
            user={user ?? { name: "…", email: "" }}
          />
        }
      />
      <div className="flex min-w-0 flex-1 flex-col">
        <Header
          greeting={{ title: activeTenant.name, subtitle: "Organization dashboard" }}
          onToggleSidebar={() => setCollapsed((prev) => !prev)}
          overviewPaths={["/overview"]}
          search={{ value: search, onChange: setSearch, placeholder: "Search members, courses…" }}
        />
        <main className="min-h-0 flex-1 overflow-y-auto p-6">{children}</main>
      </div>
    </div>
  );
}
