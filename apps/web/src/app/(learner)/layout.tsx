"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";

import { createAuthClient, useActiveOrg, useMemberships, useUser } from "@datarango/auth";
import { NotificationBell, useNotificationToasts } from "@datarango/realtime";
import { ContextSwitcher, Header, Sidebar } from "@datarango/ui";
import { LEARNER_ROUTES } from "@/config/routes";

const auth = createAuthClient();

export default function LearnerLayout({ children }: { children: React.ReactNode }) {
  const [collapsed, setCollapsed] = useState(false);
  const [search, setSearch] = useState("");
  const router = useRouter();
  const session = useUser();
  const memberships = useMemberships();
  const { activeOrgId, setOrgContext } = useActiveOrg();

  // Mounted on the shell rather than on a page, so a certificate issued while
  // the learner is reading a lesson still announces itself. The bell below and
  // this hook share one polled count.
  useNotificationToasts();

  // Learners with an org membership can flip between personal and org context.
  const primaryOrg = memberships[0];

  return (
    <div className="flex h-dvh overflow-hidden">
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
          search={{
            value: search,
            onChange: setSearch,
            placeholder: "Search courses and quizzes…",
            // Navigates rather than filtering in place: results span kinds and
            // need their own page, and a URL you can share or come back to beats
            // a query held in a header's local state — which is all this box did
            // before the search service existed.
            onSubmit: () => {
              const q = search.trim();
              if (q) router.push(`/dashboard/search?q=${encodeURIComponent(q)}`);
            },
          }}
          actions={<NotificationBell />}
        />
        {/* `flex flex-col` is load-bearing, not decoration: a *block* scroll
            container drops its bottom padding once the content overflows, so the
            last row of every page sat flush against the window edge. A flex
            scroll container keeps its end padding in the scrollable area.
            `overscroll-contain` stops the gesture chaining to the document at
            the end of the scroll. */}
        <main className="flex min-h-0 flex-1 flex-col overflow-y-auto overscroll-contain p-6">
          {children}
        </main>
      </div>
    </div>
  );
}
