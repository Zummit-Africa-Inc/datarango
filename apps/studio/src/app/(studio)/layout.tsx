"use client";

import { useEffect, useState } from "react";
import { usePathname } from "next/navigation";

import { createAuthClient, useAuthStatus, useUser } from "@datarango/auth";
import { ContextSwitcher, Header, Loader, Logo, Sidebar } from "@datarango/ui";

import { STUDIO_ROUTES } from "@/config/routes";

const auth = createAuthClient();

/**
 * Creator shell. Unlike the console there is no org switcher: the catalog is
 * creator-scoped (the gateway resolves catalog calls with a null org), so a
 * course belongs to the person, not to whichever org they last looked at.
 *
 * Every hook runs before the first early return — the console's equivalent
 * layout calls useMemo/useEffect after its loading return, which breaks the
 * rules of hooks the moment status flips.
 */
export default function StudioLayout({ children }: { children: React.ReactNode }) {
  const [collapsed, setCollapsed] = useState(false);
  const [search, setSearch] = useState("");

  const pathname = usePathname();
  const status = useAuthStatus();
  const user = useUser();

  // No session → hand off to the BFF sign-in, which completes via the shared
  // SSO cookie if the user is already signed into any Datarango app.
  useEffect(() => {
    if (status === "guest") {
      window.location.assign(`/api/auth/signin?returnTo=${encodeURIComponent(pathname)}`);
    }
  }, [status, pathname]);

  if (status !== "authenticated") {
    return <Loader />;
  }

  return (
    <div className="flex h-screen">
      <Sidebar
        collapsed={collapsed}
        logoHref="/courses"
        routes={STUDIO_ROUTES}
        top={
          <div className="flex items-center gap-2 px-2 py-1.5">
            <Logo />
            {!collapsed && <span className="text-sm font-medium">Studio</span>}
          </div>
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
          greeting={{ title: "Studio", subtitle: "Author courses, quizzes and exercises" }}
          onToggleSidebar={() => setCollapsed((prev) => !prev)}
          overviewPaths={["/courses"]}
          search={{ value: search, onChange: setSearch, placeholder: "Search your courses…" }}
        />
        <main className="min-h-0 flex-1 overflow-y-auto p-6">{children}</main>
      </div>
    </div>
  );
}
