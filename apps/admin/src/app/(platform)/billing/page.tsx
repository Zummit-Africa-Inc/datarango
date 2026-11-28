"use client";

import { Wallet } from "lucide-react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useState } from "react";

import { useStaffPermission } from "@datarango/auth";
import { Button, Input, Label, PageLayout, Skeleton } from "@datarango/ui";

import { Notice, SearchBox, useDebounced } from "@/components/people-ui";
import { usePlatformOrgs } from "@/hooks/operations";

const GUID = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

/**
 * Billing operations: pick an organisation, then see and act on its
 * subscription. Finding orgs by name needs orgs:organizations:view as well;
 * without it, billing staff go by org id.
 */
export default function BillingPage() {
  const canView = useStaffPermission("billing:organization:view");
  const canFindOrgs = useStaffPermission("orgs:organizations:view");

  return (
    <PageLayout
      title="Billing Operations"
      subtitle="Organisations' subscriptions, negotiated prices and billing history."
    >
      {!canView ? (
        <Notice
          title="You can't see billing"
          body="This needs the billing:organization:view permission."
        />
      ) : canFindOrgs ? (
        <OrgPicker />
      ) : (
        <OrgIdForm />
      )}
    </PageLayout>
  );
}

const OrgPicker = () => {
  const [input, setInput] = useState("");
  const query = useDebounced(input.trim());
  const { data, isLoading } = usePlatformOrgs({ query, pageSize: 20 });
  const items = data?.items ?? [];

  return (
    <div className="space-y-4">
      <SearchBox
        label="Find an organisation"
        placeholder="Find an organisation by name"
        value={input}
        onChange={setInput}
      />
      {isLoading ? (
        <Skeleton skeleton="table" rows={5} columns={1} />
      ) : items.length === 0 ? (
        <Notice
          icon={<Wallet className="text-muted-foreground mx-auto size-8" strokeWidth={1.5} />}
          title="No organisation matches"
          body="Try part of its name."
        />
      ) : (
        <ul className="border-hairline bg-card divide-hairline divide-y rounded-xs border">
          {items.map((org) => (
            <li key={org.id}>
              <Link
                href={`/billing/${org.id}`}
                className="hover:bg-muted/40 flex items-center justify-between gap-3 px-4 py-3 text-sm"
              >
                <span className="text-ink font-medium">{org.name}</span>
                <span className="text-muted-foreground text-xs">
                  {org.memberCount} members{org.suspendedAt ? " · suspended" : ""}
                </span>
              </Link>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
};

const OrgIdForm = () => {
  const router = useRouter();
  const [orgId, setOrgId] = useState("");
  return (
    <form
      className="border-hairline bg-card max-w-xl space-y-3 rounded-xs border p-5"
      onSubmit={(e) => {
        e.preventDefault();
        router.push(`/billing/${orgId.trim()}`);
      }}
    >
      <Label htmlFor="org-id">Organisation id</Label>
      <Input id="org-id" value={orgId} onChange={(e) => setOrgId(e.target.value)} />
      <p className="text-muted-foreground text-xs">
        Finding organisations by name needs orgs:organizations:view too.
      </p>
      <div className="flex justify-end">
        <Button type="submit" disabled={!GUID.test(orgId.trim())}>
          Open billing
        </Button>
      </div>
    </form>
  );
};
