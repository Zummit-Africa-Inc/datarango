"use client";

import { Building2 } from "lucide-react";
import Link from "next/link";
import { useState } from "react";

import { useStaffPermission } from "@datarango/auth";
import {
  Badge,
  Button,
  PageLayout,
  Skeleton,
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@datarango/ui";

import { Notice, Pager, SearchBox, formatDate, useDebounced } from "@/components/people-ui";
import { usePlatformOrgs } from "@/hooks/operations";

const PAGE_SIZE = 25;

/** Every organisation on Datarango. */
export default function OrganizationsPage() {
  const canView = useStaffPermission("orgs:organizations:view");
  const canManage = useStaffPermission("orgs:organizations:manage");

  return (
    <PageLayout title="Organisations" subtitle="Every organisation on Datarango and its members.">
      {canView ? (
        <OrgList canManage={canManage} />
      ) : (
        <Notice
          title="You can't see organisations"
          body="This needs the orgs:organizations:view permission."
        />
      )}
    </PageLayout>
  );
}

const OrgList = ({ canManage }: { canManage: boolean }) => {
  const [input, setInput] = useState("");
  const query = useDebounced(input.trim());
  const [page, setPage] = useState(1);
  const { data, isLoading } = usePlatformOrgs({ query, page, pageSize: PAGE_SIZE });
  const items = data?.items ?? [];
  const total = data?.total ?? 0;

  return (
    <div className="space-y-4">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <SearchBox
          label="Search organisations"
          placeholder="Search by name"
          value={input}
          onChange={(v) => {
            setInput(v);
            setPage(1);
          }}
        />
        {canManage && (
          <Button asChild size="sm">
            <Link href="/organizations/new">New organisation</Link>
          </Button>
        )}
      </div>

      {isLoading ? (
        <Skeleton skeleton="table" rows={6} columns={4} />
      ) : items.length === 0 ? (
        <Notice
          icon={<Building2 className="text-muted-foreground mx-auto size-8" strokeWidth={1.5} />}
          title={query ? "No organisation matches" : "No organisations yet"}
          body={query ? "Try part of its name." : "Organisations appear here once created."}
        />
      ) : (
        <div className="border-hairline bg-card overflow-x-auto rounded-xs border">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead className="min-w-56">Organisation</TableHead>
                <TableHead>Members</TableHead>
                <TableHead>Status</TableHead>
                <TableHead>Created</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {items.map((org) => (
                <TableRow key={org.id}>
                  <TableCell>
                    <Link href={`/organizations/${org.id}`} className="block hover:underline">
                      <span className="text-ink block font-medium">{org.name}</span>
                      <span className="text-muted-foreground block font-mono text-xs">
                        {org.slug}
                      </span>
                    </Link>
                  </TableCell>
                  <TableCell className="mono-data">{org.memberCount}</TableCell>
                  <TableCell>
                    {org.suspendedAt ? (
                      <Badge tone="danger">Suspended</Badge>
                    ) : (
                      <Badge tone="success">Active</Badge>
                    )}
                  </TableCell>
                  <TableCell className="text-muted-foreground text-xs">
                    {formatDate(org.createdAt)}
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </div>
      )}

      {total > PAGE_SIZE && (
        <Pager
          page={page}
          pages={Math.max(1, Math.ceil(total / PAGE_SIZE))}
          total={total}
          onPage={setPage}
          noun="organisations"
        />
      )}
    </div>
  );
};
