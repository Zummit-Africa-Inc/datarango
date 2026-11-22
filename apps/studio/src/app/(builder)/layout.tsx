"use client";

import { useEffect } from "react";
import { usePathname } from "next/navigation";

import { useAuthStatus } from "@datarango/auth";
import { Loader, TooltipProvider } from "@datarango/ui";

/**
 * Focus mode for the course builder (§7.6): no app sidebar or top bar, just the
 * builder's own chrome. Same sign-in hand-off as the studio shell.
 */
export default function BuilderLayout({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const status = useAuthStatus();

  useEffect(() => {
    if (status === "guest") {
      window.location.assign(`/api/auth/signin?returnTo=${encodeURIComponent(pathname)}`);
    }
  }, [status, pathname]);

  if (status !== "authenticated") return <Loader />;

  return (
    <TooltipProvider>
      <div className="bg-background flex h-dvh flex-col overflow-hidden">{children}</div>
    </TooltipProvider>
  );
}
