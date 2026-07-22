"use client";

import { useState } from "react";

import { createAuthClient } from "@datarango/auth";
import { CompanySwitcher, ContextSwitcher, Header, Sidebar, type Tenant } from "@datarango/ui";

import { MOCK_TENANTS } from "@/mock/overview";
import { ORG_ROUTES } from "@/config/routes";

const MOCK_USER = { name: "Tolu Adebayo", email: "tolu@acme.academy" };

const auth = createAuthClient();

export default function OrgLayout({ children }: { children: React.ReactNode }) {
  const [collapsed, setCollapsed] = useState(false);
  const [tenant, setTenant] = useState<Tenant>(MOCK_TENANTS[0]!);
  const [search, setSearch] = useState("");

  return (
    <div className="flex h-screen">
      <Sidebar
        collapsed={collapsed}
        logoHref="/overview"
        routes={ORG_ROUTES}
        top={
          <CompanySwitcher
            collapsed={collapsed}
            currentTenant={tenant}
            onTenantChange={setTenant}
            tenants={MOCK_TENANTS}
          />
        }
        footer={<ContextSwitcher onSignOut={() => auth.signOut()} user={MOCK_USER} />}
      />
      <div className="flex min-w-0 flex-1 flex-col">
        <Header
          greeting={{ title: tenant.name, subtitle: "Current cycle: July 2026" }}
          onToggleSidebar={() => setCollapsed((prev) => !prev)}
          overviewPaths={["/overview"]}
          search={{ value: search, onChange: setSearch, placeholder: "Search members, courses…" }}
        />
        <main className="min-h-0 flex-1 overflow-y-auto p-6">{children}</main>
      </div>
    </div>
  );
}
