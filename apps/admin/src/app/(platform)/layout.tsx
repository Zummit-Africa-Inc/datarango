"use client";

import { useEffect, useMemo } from "react";
import { usePathname } from "next/navigation";

import { useAuthStatus, useIsStaff, useUser } from "@datarango/auth";
import { ADMIN_NAV, AppShell, Loader, filterNav } from "@datarango/ui";

const API_URL = process.env.NEXT_PUBLIC_API_URL || "http://localhost:8080";

/**
 * Ends the staff session on accounts and this app's tokens, then Trustaige's
 * session too (TRUSTAIGE.md §6.3), so the next person at this browser has to
 * sign in rather than finishing silently on someone else's session.
 */
const signOut = async () => {
  const res = await fetch(`${API_URL}/auth/staff/logout`, {
    method: "POST",
    credentials: "include",
  }).catch(() => null);
  const body = res?.ok
    ? ((await res.json().catch(() => null)) as { endSessionUrl?: string | null } | null)
    : null;
  // Not auth.signOut(): it navigates to "/" itself, racing the redirect below.
  await fetch("/api/auth/signout", { method: "POST" }).catch(() => undefined);
  window.location.assign(body?.endSessionUrl || "/signin");
};

/** Staff shell. A non-staff session (which accounts shouldn't issue here) gets an explanation, not the app. */
export default function PlatformLayout({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const status = useAuthStatus();
  const user = useUser();
  const isStaff = useIsStaff();

  const permissions = user?.staffPermissions;
  const nav = useMemo(
    () => filterNav(ADMIN_NAV, (p) => (permissions as string[] | undefined)?.includes(p) ?? false),
    [permissions],
  );

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
      <div className="bg-background flex h-screen items-center justify-center p-6">
        <div className="border-border bg-card max-w-md rounded-lg border px-6 py-10 text-center">
          <p className="font-display text-foreground text-lg font-semibold">
            This area is for Datarango staff
          </p>
          <p className="text-foreground-muted mt-2 text-sm">
            You&apos;re signed in as {user?.email}, which isn&apos;t a staff account. Staff accounts
            are separate from learner accounts and are created by invitation.
          </p>
          <button
            className="text-primary mt-4 text-sm underline-offset-4 hover:underline"
            onClick={signOut}
            type="button"
          >
            Sign out
          </button>
        </div>
      </div>
    );
  }

  return (
    <AppShell
      nav={nav}
      homeHref="/overview"
      product="Admin"
      overviewPaths={["/overview"]}
      greeting={{ title: "Platform overview", subtitle: "Everything across Datarango" }}
      searchPlaceholder="Search admin…"
      user={{
        name: user?.name ?? "…",
        email: user?.email ?? "",
        avatarUrl: user?.avatarUrl,
        role: "Staff",
      }}
      onSignOut={signOut}
    >
      {children}
    </AppShell>
  );
}
