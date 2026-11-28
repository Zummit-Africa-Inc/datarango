"use client";

import { ScrollText } from "lucide-react";
import Link from "next/link";
import { useState } from "react";

import { useStaffPermission } from "@datarango/auth";
import {
  Badge,
  Button,
  PageLayout,
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
  Skeleton,
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@datarango/ui";

import { Notice } from "@/components/people-ui";
import {
  AUDIT_CATEGORIES,
  auditCategoryLabel,
  useAuditLog,
  type AuditCategory,
} from "@/hooks/operations";

const PAGE = 50;

/**
 * The platform audit log: every privileged action in every organisation, plus
 * the platform-level ones. Read only; nobody can change it.
 */
export default function AuditPage() {
  const canView = useStaffPermission("audit:events:view");

  return (
    <PageLayout
      title="Audit Log"
      subtitle="Privileged actions across Datarango, newest first. Entries can't be edited or deleted."
    >
      {canView ? (
        <AuditLog />
      ) : (
        <Notice
          title="You can't read the audit log"
          body="This needs the audit:events:view permission."
        />
      )}
    </PageLayout>
  );
}

const AuditLog = () => {
  const canSeeOrgs = useStaffPermission("orgs:organizations:view");
  const [category, setCategory] = useState<AuditCategory | "">("");
  // Cursors of the pages already passed, so "Newer" can step back.
  const [cursors, setCursors] = useState<string[]>([]);
  const before = cursors.at(-1);
  const { data, isLoading } = useAuditLog({ category, before, take: PAGE });
  const entries = data?.entries ?? [];

  return (
    <div className="space-y-4">
      <Select
        value={category || "all"}
        onValueChange={(v) => {
          setCategory(v === "all" ? "" : (v as AuditCategory));
          setCursors([]);
        }}
      >
        <SelectTrigger aria-label="Filter by category" className="w-52">
          <SelectValue />
        </SelectTrigger>
        <SelectContent>
          <SelectItem value="all">All categories</SelectItem>
          {AUDIT_CATEGORIES.map((c) => (
            <SelectItem key={c} value={c}>
              {auditCategoryLabel[c]}
            </SelectItem>
          ))}
        </SelectContent>
      </Select>

      {isLoading ? (
        <Skeleton skeleton="table" rows={8} columns={4} />
      ) : entries.length === 0 ? (
        <Notice
          icon={<ScrollText className="text-muted-foreground mx-auto size-8" strokeWidth={1.5} />}
          title="Nothing recorded"
          body={
            before ? "There's nothing older." : "Privileged actions appear here as they happen."
          }
        />
      ) : (
        <div className="border-hairline bg-card overflow-x-auto rounded-xs border">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>When</TableHead>
                <TableHead>Category</TableHead>
                <TableHead className="min-w-72">What happened</TableHead>
                <TableHead>Where</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {entries.map((e) => (
                <TableRow key={e.id}>
                  <TableCell className="text-muted-foreground text-xs whitespace-nowrap">
                    {new Date(e.occurredAt).toLocaleString()}
                  </TableCell>
                  <TableCell>
                    <Badge appearance="outline" tone="neutral">
                      {auditCategoryLabel[e.category] ?? e.category}
                    </Badge>
                  </TableCell>
                  <TableCell>
                    <p className="text-ink text-sm">{e.summary}</p>
                    <p className="text-muted-foreground font-mono text-xs">{e.action}</p>
                  </TableCell>
                  <TableCell className="text-xs">
                    {!e.orgId ? (
                      <span className="text-muted-foreground">Platform</span>
                    ) : canSeeOrgs ? (
                      <Link href={`/organizations/${e.orgId}`} className="hover:underline">
                        Organisation
                      </Link>
                    ) : (
                      <span className="text-muted-foreground">Organisation</span>
                    )}
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </div>
      )}

      <div className="flex justify-end gap-2">
        <Button
          size="sm"
          variant="outline"
          disabled={cursors.length === 0}
          onClick={() => setCursors((c) => c.slice(0, -1))}
        >
          Newer
        </Button>
        <Button
          size="sm"
          variant="outline"
          disabled={entries.length < PAGE}
          onClick={() => setCursors((c) => [...c, entries.at(-1)!.occurredAt])}
        >
          Older
        </Button>
      </div>
    </div>
  );
};
