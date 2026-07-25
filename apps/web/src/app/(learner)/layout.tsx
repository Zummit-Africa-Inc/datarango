"use client";

import { useState } from "react";

import { ContextSwitcher, Header, Sidebar } from "@datarango/ui";
import { createAuthClient, useActiveOrg, useMemberships, useUser } from "@datarango/auth";
import { LEARNER_ROUTES } from "@/config/routes";

const auth = createAuthClient();

export default function LearnerLayout({ children }: { children: React.ReactNode }) {
  const [collapsed, setCollapsed] = useState(false);
  const [search, setSearch] = useState("");
  const session = useUser();
  const memberships = useMemberships();
  const { activeOrgId, setOrgContext } = useActiveOrg();

  // Learners with an org membership can flip between personal and org context.
  const primaryOrg = memberships[0];

  return (
    <div className="flex h-screen">
      <Sidebar
        collapsed={collapsed}
        logoHref="/dashboard"
        routes={LEARNER_ROUTES}
        footer={
          <ContextSwitcher
            onSignOut={() => auth.signOut()}
            user={session ?? { name: "…", email: "" }}
            contextToggle={
              primaryOrg
                ? {
                    title: primaryOrg.orgName,
                    description: activeOrgId
                      ? "Viewing your org context"
                      : "Switch to your org context",
                    checked: activeOrgId === primaryOrg.orgId,
                    onCheckedChange: (checked) => setOrgContext(checked ? primaryOrg.orgId : null),
                  }
                : undefined
            }
          />
        }
      />
      <div className="flex min-w-0 flex-1 flex-col">
        <Header
          greeting={{
            title: `Welcome back, ${session?.name?.split(" ")[0] ?? "Learner"}`,
            subtitle: "Keep the streak alive",
          }}
          onToggleSidebar={() => setCollapsed((prev) => !prev)}
          overviewPaths={["/dashboard"]}
          search={{ value: search, onChange: setSearch, placeholder: "Search courses, datasets…" }}
        />
        <main className="min-h-0 flex-1 overflow-y-auto p-6">{children}</main>
      </div>
    </div>
  );
}
