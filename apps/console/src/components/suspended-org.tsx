"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { type ReactNode } from "react";
import { CircleAlert } from "lucide-react";

import { useActiveOrg } from "@datarango/auth";
import { Button } from "@datarango/ui";

/** Roles the gateway still lets into billing while the org is suspended. */
const CAN_PAY = new Set(["owner", "admin"]);

/**
 * Wraps the org pages while the active org's subscription is suspended.
 *
 * Mirrors the gateway's freeze (every org route answers 403 `org.suspended`
 * except billing, and billing only for owners and admins): owners and admins
 * see billing with a banner and are pointed there from every other page;
 * everyone else gets a "contact your administrator" notice. This is
 * presentation only — the gateway enforces it either way.
 *
 * Driven by `suspended` on the session's membership, so it shows from the
 * next session load after billing suspends the org.
 */
export const SuspendedOrgGate = ({ children }: { children: ReactNode }) => {
  const pathname = usePathname();
  const { membership } = useActiveOrg();

  if (!membership?.suspended) {
    return <>{children}</>;
  }

  const canPay = CAN_PAY.has(membership.role);
  const onBilling = pathname === "/billing" || pathname.startsWith("/billing/");

  if (canPay && onBilling) {
    return (
      <>
        <div
          className="border-destructive/30 bg-destructive/5 text-ink mb-6 flex items-start gap-3 rounded-lg border p-4 text-sm"
          role="alert"
        >
          <CircleAlert className="text-destructive mt-0.5 size-4 shrink-0" aria-hidden />
          <p>
            {membership.orgName}&apos;s subscription is suspended. Members can&apos;t use the
            platform until the outstanding invoice is paid. Everything is kept and comes back as it
            was.
          </p>
        </div>
        {children}
      </>
    );
  }

  return (
    <div className="grid flex-1 place-items-center">
      <div className="max-w-md space-y-4 text-center">
        <CircleAlert className="text-destructive mx-auto size-8" aria-hidden />
        <h1 className="font-heading text-ink text-xl">Subscription suspended</h1>
        <p className="text-muted-foreground text-sm">
          {canPay
            ? `${membership.orgName}'s subscription is suspended, so its members, courses and reports are paused. Pay the outstanding invoice to restore everything as it was.`
            : `${membership.orgName}'s subscription is suspended. Contact your organization's administrator to restore access.`}
        </p>
        {canPay && (
          <Button asChild>
            <Link href="/billing">Go to billing</Link>
          </Button>
        )}
      </div>
    </div>
  );
};
