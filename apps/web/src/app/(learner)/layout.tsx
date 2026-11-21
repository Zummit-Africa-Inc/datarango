"use client";

import { useRouter } from "next/navigation";
import { Building2 } from "lucide-react";

import { createAuthClient, useActiveOrg, useMemberships, useUser } from "@datarango/auth";
import { NotificationBell, useNotificationToasts } from "@datarango/realtime";
import { AppShell, DropdownMenuCheckboxItem, LEARNER_NAV } from "@datarango/ui";

import { TokenBalance } from "@/components/token-balance";

const auth = createAuthClient();

/**
 * Learner shell. Route protection lives in the proxy (`/dashboard/*`), so there
 * is no auth gate here. Org members can switch the app into their org context
 * from the account menu.
 */
export default function LearnerLayout({ children }: { children: React.ReactNode }) {
  const router = useRouter();
  const session = useUser();
  const memberships = useMemberships();
  const { activeOrgId, setOrgContext } = useActiveOrg();

  useNotificationToasts();

  const primaryOrg = memberships[0];

  return (
    <AppShell
      nav={LEARNER_NAV}
      homeHref="/dashboard"
      overviewPaths={["/dashboard"]}
      greeting={{
        title: `Welcome back, ${session?.name?.split(" ")[0] ?? "learner"}`,
        subtitle: "Keep the streak alive",
      }}
      searchPlaceholder="Search courses and quizzes…"
      onSearch={(q) => router.push(`/dashboard/search?q=${encodeURIComponent(q)}`)}
      topBarActions={
        <>
          <TokenBalance />
          <NotificationBell />
        </>
      }
      user={{
        name: session?.name ?? "…",
        email: session?.email ?? "",
        avatarUrl: session?.avatarUrl,
        role: activeOrgId && primaryOrg ? primaryOrg.orgName : "Learner",
      }}
      settingsHref="/dashboard/settings"
      items={
        primaryOrg ? (
          <DropdownMenuCheckboxItem
            checked={activeOrgId === primaryOrg.orgId}
            onCheckedChange={(checked) => setOrgContext(checked ? primaryOrg.orgId : null)}
          >
            <Building2 />
            {primaryOrg.orgName} view
          </DropdownMenuCheckboxItem>
        ) : undefined
      }
      onSignOut={() => auth.signOut()}
    >
      {children}
    </AppShell>
  );
}
