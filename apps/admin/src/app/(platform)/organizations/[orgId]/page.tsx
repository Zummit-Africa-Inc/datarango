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
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@datarango/ui";

import { countryName } from "@/components/org-form";
import { Notice, formatDate } from "@/components/people-ui";
import { usePlatformOrg, useSetOrgSuspended } from "@/hooks/operations";

/** One organisation: its members, its state, and a way to its billing. */
export default function OrganizationPage() {
  const { orgId } = useParams<{ orgId: string }>();
  const canView = useStaffPermission("orgs:organizations:view");

  return (
    <PageLayout title="Organisation" subtitle="Members and status.">
      <Link
        href="/organizations"
        className="text-muted-foreground hover:text-ink mb-4 inline-flex items-center gap-1 text-sm"
      >
        <ArrowLeft className="size-4" /> All organisations
      </Link>
      {canView ? (
        <OrgDetail orgId={orgId} />
      ) : (
        <Notice
          title="You can't see organisations"
          body="This needs the orgs:organizations:view permission."
        />
      )}
    </PageLayout>
  );
}

const OrgDetail = ({ orgId }: { orgId: string }) => {
  const canManage = useStaffPermission("orgs:organizations:manage");
  const canEdit = useStaffPermission("orgs:organizations:create");
  const canSeeBilling = useStaffPermission("billing:organization:view");
  const canSeeUsers = useStaffPermission("users:accounts:view");
  const { data, isLoading, error } = usePlatformOrg(orgId);
  const setSuspended = useSetOrgSuspended();
  const [confirming, setConfirming] = useState(false);

  if (isLoading) return <Skeleton skeleton="page" />;
  if (!data) {
    return <Notice title="Organisation not found" body={error?.message ?? "No org has that id."} />;
  }

  const { org, members } = data;
  const suspended = !!org.suspendedAt;

  return (
    <div className="space-y-6">
      <div className="border-hairline bg-card flex flex-wrap items-start justify-between gap-4 rounded-xs border p-5">
        <div>
          <p className="font-heading text-ink text-xl">{org.name}</p>
          <p className="text-muted-foreground font-mono text-xs">{org.slug}</p>
          <div className="mt-2">
            {suspended ? (
              <Badge tone="danger">Suspended</Badge>
            ) : (
              <Badge tone="success">Active</Badge>
            )}
          </div>
        </div>
        <div className="flex flex-wrap gap-2">
          {canEdit && (
            <Button asChild variant="secondary">
              <Link href={`/organizations/${org.id}/edit`}>Edit details</Link>
            </Button>
          )}
          {canSeeBilling && (
            <Button asChild variant="secondary">
              <Link href={`/billing/${org.id}`}>Billing</Link>
            </Button>
          )}
          {canManage && (
            <Button
              variant={suspended ? "secondary" : "destructive"}
              disabled={setSuspended.isPending}
              onClick={() =>
                suspended ? setSuspended.mutate({ orgId, suspended: false }) : setConfirming(true)
              }
            >
              {suspended ? "Restore organisation" : "Suspend organisation"}
            </Button>
          )}
        </div>
      </div>

      <div className="grid gap-6 lg:grid-cols-2">
        <section className="border-hairline bg-card rounded-xs border p-5">
          <h2 className="text-ink mb-2 text-sm font-medium">Account</h2>
          <PropertyList
            items={[
              { label: "Created", value: formatDate(org.createdAt) },
              { label: "Active members", value: String(org.memberCount) },
              { label: "Suspended", value: suspended ? formatDate(org.suspendedAt) : "No" },
              {
                label: "Datarango courses",
                value: org.allowPlatformCourses ? "Shown to members" : "Hidden from members",
              },
              { label: "Org id", value: <span className="font-mono text-xs">{org.id}</span> },
            ]}
          />
        </section>
        <section className="border-hairline bg-card rounded-xs border p-5">
          <h2 className="text-ink mb-2 text-sm font-medium">Details</h2>
          <PropertyList
            items={[
              { label: "Website", value: org.profile.website ?? "—" },
              { label: "Industry", value: org.profile.industry ?? "—" },
              { label: "Size", value: org.profile.size ? `${org.profile.size} people` : "—" },
              { label: "Country", value: countryName(org.profile.country) ?? "—" },
              { label: "Billing email", value: org.profile.billingEmail ?? "—" },
              { label: "Phone", value: org.profile.phone ?? "—" },
              { label: "Tax ID", value: org.profile.taxId ?? "—" },
              { label: "Address", value: org.profile.address ?? "—" },
            ]}
          />
          {org.profile.notes && (
            <p className="bg-background-subtle text-muted-foreground mt-3 rounded-xs p-3 text-sm whitespace-pre-line">
              {org.profile.notes}
            </p>
          )}
        </section>
      </div>

      <section className="border-hairline bg-card overflow-x-auto rounded-xs border">
        <h2 className="text-ink px-4 pt-4 text-sm font-medium">Members</h2>
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead className="min-w-56">Person</TableHead>
              <TableHead>Role</TableHead>
              <TableHead>Joined</TableHead>
              <TableHead>Status</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {members.map((m) => (
              <TableRow key={m.userId}>
                <TableCell>
                  {canSeeUsers ? (
                    <Link href={`/users/${m.userId}`} className="block hover:underline">
                      <span className="text-ink block">{m.displayName ?? "Unknown user"}</span>
                      <span className="text-muted-foreground block text-xs">{m.email}</span>
                    </Link>
                  ) : (
                    <span className="text-ink">{m.displayName ?? "Unknown user"}</span>
                  )}
                </TableCell>
                <TableCell className="text-sm capitalize">{m.role}</TableCell>
                <TableCell className="text-muted-foreground text-xs">
                  {formatDate(m.joinedAt)}
                </TableCell>
                <TableCell>
                  {m.deactivatedAt ? (
                    <Badge tone="neutral">Removed</Badge>
                  ) : (
                    <Badge tone="success">Active</Badge>
                  )}
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </section>

      {confirming && (
        <Dialog open onOpenChange={(open) => !open && setConfirming(false)}>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Suspend {org.name}?</DialogTitle>
              <DialogDescription>
                Members whose sign-in is managed by {org.name} are blocked until it&apos;s restored.
                Owners and admins can still sign in to sort out billing. A later billing event (a
                payment, say) can lift the suspension.
              </DialogDescription>
            </DialogHeader>
            <DialogFooter>
              <Button variant="ghost" onClick={() => setConfirming(false)}>
                Cancel
              </Button>
              <Button
                variant="destructive"
                disabled={setSuspended.isPending}
                onClick={() =>
                  setSuspended.mutate(
                    { orgId, suspended: true },
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
