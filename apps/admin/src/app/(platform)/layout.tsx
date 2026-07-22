"use client";

import { useState } from "react";

import { createAuthClient } from "@datarango/auth";
import { ContextSwitcher, Header, Sidebar } from "@datarango/ui";

import { ADMIN_ROUTES } from "@/config/routes";

const MOCK_USER = { name: "Platform Staff", email: "staff@datarango.com" };

const auth = createAuthClient();

export default function PlatformLayout({ children }: { children: React.ReactNode }) {
  const [collapsed, setCollapsed] = useState(false);
  const [search, setSearch] = useState("");

  return (
    <div className="flex h-screen">
      <Sidebar
        collapsed={collapsed}
        logoHref="/overview"
        routes={ADMIN_ROUTES}
        footer={<ContextSwitcher onSignOut={() => auth.signOut()} user={MOCK_USER} />}
      />
      <div className="flex min-w-0 flex-1 flex-col">
        <Header
          greeting={{ title: "Platform overview", subtitle: "All systems operational" }}
          onToggleSidebar={() => setCollapsed((prev) => !prev)}
          overviewPaths={["/overview"]}
          search={{ value: search, onChange: setSearch, placeholder: "Search users, orgs…" }}
        />
        <main className="min-h-0 flex-1 overflow-y-auto p-6">{children}</main>
      </div>
    </div>
  );
}
