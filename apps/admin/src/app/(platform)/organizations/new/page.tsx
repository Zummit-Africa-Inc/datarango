"use client";

import { ArrowLeft } from "lucide-react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useState } from "react";

import { useStaffPermission } from "@datarango/auth";
import { Button, Input, Label, PageLayout } from "@datarango/ui";

import { Notice } from "@/components/people-ui";
import { useCreateOrg } from "@/hooks/operations";

/**
 * Creates an organisation for an existing user, who becomes its owner. Staff
 * can't create user accounts, so the owner has to have signed up already.
 */
export default function NewOrganizationPage() {
  const canManage = useStaffPermission("orgs:organizations:manage");
  const router = useRouter();
  const create = useCreateOrg();
  const [name, setName] = useState("");
  const [ownerEmail, setOwnerEmail] = useState("");

  const valid = name.trim().length >= 2 && /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(ownerEmail.trim());

  return (
    <PageLayout title="New organisation" subtitle="Set up an organisation for an existing user.">
      <Link
        href="/organizations"
        className="text-muted-foreground hover:text-ink mb-4 inline-flex items-center gap-1 text-sm"
      >
        <ArrowLeft className="size-4" /> All organisations
      </Link>
      {!canManage ? (
        <Notice
          title="You can't create organisations"
          body="This needs the orgs:organizations:manage permission."
        />
      ) : (
        <form
          className="border-hairline bg-card max-w-xl space-y-5 rounded-xs border p-5"
          onSubmit={(e) => {
            e.preventDefault();
            create.mutate(
              { name: name.trim(), ownerEmail: ownerEmail.trim() },
              { onSuccess: (org) => router.push(`/organizations/${org.id}`) },
            );
          }}
        >
          <div className="space-y-2">
            <Label htmlFor="org-name">Organisation name</Label>
            <Input id="org-name" value={name} onChange={(e) => setName(e.target.value)} />
          </div>
          <div className="space-y-2">
            <Label htmlFor="org-owner">Owner&apos;s email</Label>
            <Input
              id="org-owner"
              type="email"
              autoComplete="off"
              value={ownerEmail}
              onChange={(e) => setOwnerEmail(e.target.value)}
            />
            <p className="text-muted-foreground text-xs">
              Must be an existing Datarango account. If they haven&apos;t signed up yet, ask them to
              first: staff can&apos;t create user accounts.
            </p>
          </div>
          <div className="flex justify-end gap-2">
            <Button asChild variant="ghost">
              <Link href="/organizations">Cancel</Link>
            </Button>
            <Button type="submit" disabled={!valid || create.isPending}>
              {create.isPending ? "Creating…" : "Create organisation"}
            </Button>
          </div>
        </form>
      )}
    </PageLayout>
  );
}
