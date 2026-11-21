"use client";

import { useEffect } from "react";
import { usePathname } from "next/navigation";

import {
  createAuthClient,
  useAuthStatus,
  useIsPlatformStaff,
  useUser,
  type PlatformRole,
} from "@datarango/auth";
import { ADMIN_NAV, AppShell, Loader } from "@datarango/ui";

const auth = createAuthClient();

const ROLE_LABELS: Record<string, string> = {
  "platform.admin": "Platform admin",
  "platform.reviewer": "Reviewer",
  "platform.support": "Support",
};

const roleLabel = (roles: PlatformRole[] | undefined) =>
  roles?.length ? roles.map((r) => ROLE_LABELS[r] ?? r).join(", ") : undefined;

/** Platform-staff shell. Anyone without a platform role gets an explanation, not the app. */
export default function PlatformLayout({ children }: { children: React.ReactNode }) {
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
      <div className="bg-background flex h-screen items-center justify-center p-6">
        <div className="border-border bg-card max-w-md rounded-lg border px-6 py-10 text-center">
          <p className="font-display text-foreground text-lg font-semibold">
            This area is for platform staff
          </p>
          <p className="text-foreground-muted mt-2 text-sm">
            You&apos;re signed in as {user?.email}, which holds no platform role. Platform access is
            granted by an existing platform admin. It is not something an organisation can give you.
          </p>
        </div>
      </div>
    );
  }

  return (
    <AppShell
      nav={ADMIN_NAV}
      homeHref="/overview"
      product="Admin"
      overviewPaths={["/overview"]}
      greeting={{ title: "Platform overview", subtitle: "Everything across Datarango" }}
      searchPlaceholder="Search admin…"
      user={{
        name: user?.name ?? "…",
        email: user?.email ?? "",
        avatarUrl: user?.avatarUrl,
        role: roleLabel(user?.platformRoles),
      }}
      onSignOut={() => auth.signOut()}
    >
      {children}
    </AppShell>
  );
}
