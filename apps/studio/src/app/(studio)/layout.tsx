"use client";

import { useEffect } from "react";
import { usePathname } from "next/navigation";
import { Plus } from "lucide-react";

import { createAuthClient, useAuthStatus, useUser } from "@datarango/auth";
import { AppShell, CREATOR_NAV, Loader } from "@datarango/ui";

import { CreateCourseDialog } from "@/components/create-course-dialog";

const auth = createAuthClient();

/**
 * Creator shell. There is no org switcher: the catalogue is creator-scoped (the
 * gateway resolves catalogue calls with a null org), so a course belongs to the
 * person, not to whichever org they last looked at.
 */
export default function StudioLayout({ children }: { children: React.ReactNode }) {
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
    <AppShell
      nav={CREATOR_NAV}
      homeHref="/courses"
      product="Studio"
      primaryAction={{
        label: "New course",
        icon: Plus,
        wrap: (button) => <CreateCourseDialog trigger={button} />,
      }}
      overviewPaths={["/courses"]}
      greeting={{ title: "Studio", subtitle: "Author courses, quizzes and exercises" }}
      searchPlaceholder="Search studio…"
      user={{
        name: user?.name ?? "…",
        email: user?.email ?? "",
        avatarUrl: user?.avatarUrl,
        role: "Creator",
      }}
      onSignOut={() => auth.signOut()}
    >
      {children}
    </AppShell>
  );
}
