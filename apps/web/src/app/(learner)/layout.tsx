"use client";

import { useState } from "react";

import { ContextSwitcher, Header, Sidebar } from "@datarango/ui";

import { LEARNER_ROUTES } from "@/config/routes";

const MOCK_USER = { name: "Ada Learner", email: "ada@datarango.com" };

export default function LearnerLayout({ children }: { children: React.ReactNode }) {
  const [collapsed, setCollapsed] = useState(false);
  const [search, setSearch] = useState("");

  return (
    <div className="flex h-screen">
      <Sidebar
        collapsed={collapsed}
        logoHref="/dashboard"
        routes={LEARNER_ROUTES}
        footer={
          <ContextSwitcher
            onSignOut={() => undefined}
            user={MOCK_USER}
            contextToggle={{
              title: "Acme Academy",
              description: "Switch to your org context",
              checked: false,
              onCheckedChange: () => undefined,
            }}
          />
        }
      />
      <div className="flex min-w-0 flex-1 flex-col">
        <Header
          greeting={{
            title: `Welcome back, ${MOCK_USER.name.split(" ")[0]}`,
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
