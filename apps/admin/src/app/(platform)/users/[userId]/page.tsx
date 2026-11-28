"use client";

import { ArrowLeft } from "lucide-react";
import Link from "next/link";
import { useParams } from "next/navigation";
import { useState } from "react";

import { useStaffPermission } from "@datarango/auth";
import {
  Badge,
  Button,
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  PageLayout,
  PropertyList,
  Skeleton,
} from "@datarango/ui";

import { Notice, formatDate, formatRelative } from "@/components/people-ui";
import { signInMethods, usePlatformUser, useSetUserActive } from "@/hooks/people";

/**
 * One user. Staff see what the account is and where it belongs; with
 * users:accounts:manage they can suspend or restore it. Creating users and
 * verifying emails are deliberately not here.
 */
export default function UserPage() {
  const { userId } = useParams<{ userId: string }>();
  const canRead = useStaffPermission("users:accounts:view");

  return (
    <PageLayout title="User" subtitle="Account details.">
      <Link
        href="/users"
        className="text-muted-foreground hover:text-ink mb-4 inline-flex items-center gap-1 text-sm"
      >
        <ArrowLeft className="size-4" /> All users
      </Link>
      {canRead ? (
        <UserDetail userId={userId} />
      ) : (
        <Notice title="You can't see users" body="This needs the users:accounts:view permission." />
      )}
    </PageLayout>
  );
}

const UserDetail = ({ userId }: { userId: string }) => {
  const canManage = useStaffPermission("users:accounts:manage");
  const canSeeOrgs = useStaffPermission("orgs:organizations:view");
  const { data: user, isLoading, error } = usePlatformUser(userId);
  const setActive = useSetUserActive();
  const [confirming, setConfirming] = useState(false);

  if (isLoading) return <Skeleton skeleton="page" />;
  if (!user) {
    return <Notice title="User not found" body={error?.message ?? "No user has that id."} />;
  }

  const suspended = !!user.deactivatedAt;

  return (
    <div className="space-y-6">
      <div className="border-hairline bg-card flex flex-wrap items-start justify-between gap-4 rounded-xs border p-5">
        <div className="min-w-0">
          <p className="font-heading text-ink text-xl">{user.displayName}</p>
          <p className="text-muted-foreground text-sm">{user.email}</p>
          <div className="mt-2 flex flex-wrap gap-1">
            {suspended ? (
              <Badge tone="danger">Suspended</Badge>
            ) : (
              <Badge tone="success">Active</Badge>
            )}
            {!user.emailVerified && <Badge tone="warning">Email not verified</Badge>}
            <Badge appearance="outline" tone="neutral">
              {user.kind === "organisation" ? "Organisation member" : "Individual"}
            </Badge>
          </div>
        </div>
        {canManage && (
          <Button
            variant={suspended ? "secondary" : "destructive"}
            disabled={setActive.isPending}
            onClick={() =>
              suspended ? setActive.mutate({ userId, active: true }) : setConfirming(true)
            }
          >
            {suspended ? "Restore account" : "Suspend account"}
          </Button>
        )}
      </div>

      <section className="border-hairline bg-card rounded-xs border p-5">
        <h2 className="text-ink mb-2 text-sm font-medium">Account</h2>
        <PropertyList
          items={[
            { label: "Joined", value: formatDate(user.createdAt) },
            { label: "Last sign-in", value: formatRelative(user.lastSignInAt) },
            { label: "Signs in with", value: signInMethods(user) },
            { label: "Two-factor", value: user.mfaEnabled ? "On" : "Off" },
            { label: "Suspended", value: suspended ? formatDate(user.deactivatedAt) : "No" },
            { label: "User id", value: <span className="font-mono text-xs">{user.userId}</span> },
          ]}
        />
      </section>

      <section className="border-hairline bg-card rounded-xs border p-5">
        <h2 className="text-ink mb-3 text-sm font-medium">Organisations</h2>
        {user.orgs.length === 0 ? (
          <p className="text-muted-foreground text-sm">Not a member of any organisation.</p>
        ) : (
          <ul className="space-y-2 text-sm">
            {user.orgs.map((o) => (
              <li key={o.orgId} className="flex flex-wrap items-center gap-2">
                {canSeeOrgs ? (
                  <Link href={`/organizations/${o.orgId}`} className="text-ink hover:underline">
                    {o.name}
                  </Link>
                ) : (
                  <span className="text-ink">{o.name}</span>
                )}
                <span className="text-muted-foreground">· {o.role}</span>
                {!o.active && <Badge tone="neutral">Removed</Badge>}
                {o.orgSuspended && <Badge tone="danger">Org suspended</Badge>}
              </li>
            ))}
          </ul>
        )}
      </section>

      {confirming && (
        <Dialog open onOpenChange={(open) => !open && setConfirming(false)}>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Suspend {user.displayName}?</DialogTitle>
              <DialogDescription>
                They are signed out and can&apos;t sign in until restored. Their courses, progress
                and memberships are kept.
              </DialogDescription>
            </DialogHeader>
            <DialogFooter>
              <Button variant="ghost" onClick={() => setConfirming(false)}>
                Cancel
              </Button>
              <Button
                variant="destructive"
                disabled={setActive.isPending}
                onClick={() =>
                  setActive.mutate(
                    { userId, active: false },
                    { onSuccess: () => setConfirming(false) },
                  )
                }
              >
                Suspend
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      )}
    </div>
  );
};
