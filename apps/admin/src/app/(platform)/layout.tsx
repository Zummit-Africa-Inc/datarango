"use client";

import { useEffect, useState } from "react";
import { usePathname } from "next/navigation";

import { createAuthClient, useAuthStatus, useIsPlatformStaff, useUser } from "@datarango/auth";
import { ContextSwitcher, Header, Loader, Sidebar } from "@datarango/ui";

import { ADMIN_ROUTES } from "@/config/routes";

const auth = createAuthClient();

/**
 * Platform-staff shell.
 *
 * Two gates, and they are different questions. The first is "are you signed in
 * at all", answered exactly as the studio answers it — hand off to the BFF
 * sign-in, which completes silently via the shared SSO cookie. The second is
 * "does this person hold any platform grant", which is what makes this app
 * different from every other shell: there is no org context here, so nothing
 * else would stop an ordinary user loading it.
 *
 * The staff check is UX, not security — every route this app calls re-checks
 * platform authority server-side, and the RLS policies behind them admit
 * nothing without it. What it buys is an honest empty state instead of a
 * dashboard full of failed requests.
 *
 * Every hook runs before the first early return; the console's equivalent
 * layout calls hooks after a loading return, which breaks the moment status
 * flips.
 */
export default function PlatformLayout({ children }: { children: React.ReactNode }) {
  const [collapsed, setCollapsed] = useState(false);
  const [search, setSearch] = useState("");

  const pathname = usePathname();
  const status = useAuthStatus();
  const user = useUser();
  const isStaff = useIsPlatformStaff();

  useEffect(() => {
    if (status === "guest") {
      window.location.assign(`/api/auth/signin?returnTo=${encodeURIComponent(pathname)}`);
    }
  }, [status, pathname]);

  if (status !== "authenticated") {
    return <Loader />;
  }

  if (!isStaff) {
    return (
      <div className="flex h-screen items-center justify-center p-6">
        <div className="border-hairline bg-card max-w-md rounded-xs border px-6 py-10 text-center">
          <p className="font-heading text-ink text-lg">This area is for platform staff</p>
          <p className="text-muted-foreground mt-2 text-sm">
            You&apos;re signed in as {user?.email}, which holds no platform role. Platform access is
            granted by an existing platform admin — it is not something an organisation can give
            you.
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="flex h-screen">
      <Sidebar
        collapsed={collapsed}
        logoHref="/overview"
        routes={ADMIN_ROUTES}
        footer={
          <ContextSwitcher
            onSignOut={() => auth.signOut()}
            user={user ?? { name: "…", email: "" }}
          />
        }
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
