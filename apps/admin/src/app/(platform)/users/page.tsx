"use client";

import { Building2, User, Users } from "lucide-react";
import Link from "next/link";
import { useState } from "react";

import { useStaffPermission } from "@datarango/auth";
import {
  Badge,
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

import {
  Notice,
  Pager,
  SearchBox,
  formatDate,
  formatRelative,
  useDebounced,
} from "@/components/people-ui";
import {
  signInMethods,
  usePlatformUsers,
  type PlatformUser,
  type UserStatusFilter,
} from "@/hooks/people";

const PAGE_SIZE = 25;

const STATUS_OPTIONS: { value: UserStatusFilter | "all"; label: string }[] = [
  { value: "all", label: "Everyone" },
  { value: "active", label: "Active" },
  { value: "suspended", label: "Suspended" },
  { value: "unverified", label: "Email not verified" },
];

/**
 * Everybody with a Datarango user account. Staff accounts are separate and
 * live on the Staff page. There is no "add user": people sign themselves up,
 * and staff can't create accounts or verify emails for them.
 */
export default function UsersPage() {
  const canRead = useStaffPermission("users:accounts:view");

  return (
    <PageLayout title="Users" subtitle="Everyone with a Datarango account.">
      {canRead ? (
        <Directory />
      ) : (
        <Notice
          title="You can't see the user directory"
          body="It shows people's email addresses, so it needs the users:accounts:view permission."
        />
      )}
    </PageLayout>
  );
}

const Directory = () => {
  const [input, setInput] = useState("");
  const query = useDebounced(input.trim());
  const [status, setStatus] = useState<UserStatusFilter>("");
  const [page, setPage] = useState(1);

  const { data, isLoading } = usePlatformUsers({ query, status, page, pageSize: PAGE_SIZE });
  const items = data?.items ?? [];
  const total = data?.total ?? 0;
  const pages = Math.max(1, Math.ceil(total / PAGE_SIZE));

  return (
    <div className="space-y-4">
      <div className="flex flex-wrap items-center gap-3">
        <SearchBox
          label="Search users"
          placeholder="Search by name or email"
          value={input}
          onChange={(v) => {
            setInput(v);
            setPage(1);
          }}
        />
        <Select
          value={status || "all"}
          onValueChange={(v) => {
            setStatus(v === "all" ? "" : (v as UserStatusFilter));
            setPage(1);
          }}
        >
          <SelectTrigger aria-label="Filter by status" className="w-48">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            {STATUS_OPTIONS.map((o) => (
              <SelectItem key={o.value} value={o.value}>
                {o.label}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      {isLoading ? (
        <Skeleton skeleton="table" rows={6} columns={6} />
      ) : items.length === 0 ? (
        <Notice
          icon={<Users className="text-muted-foreground mx-auto size-8" strokeWidth={1.5} />}
          title={query || status ? "No one matches" : "No accounts yet"}
          body={
            query || status
              ? "Try part of their email address or name, or another filter."
              : "Accounts appear here as people sign up."
          }
        />
      ) : (
        <div className="border-hairline bg-card overflow-x-auto rounded-xs border">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead className="min-w-56">User</TableHead>
                <TableHead className="min-w-48">Type</TableHead>
                <TableHead>Status</TableHead>
                <TableHead>Sign-in</TableHead>
                <TableHead>Joined</TableHead>
                <TableHead>Last sign-in</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {items.map((user) => (
                <UserRow key={user.userId} user={user} />
              ))}
            </TableBody>
          </Table>
        </div>
      )}

      {total > PAGE_SIZE && (
        <Pager page={page} pages={pages} total={total} onPage={setPage} noun="accounts" />
      )}
    </div>
  );
};

const UserRow = ({ user }: { user: PlatformUser }) => {
  const activeOrgs = user.orgs.filter((o) => o.active);
  return (
    <TableRow>
      <TableCell>
        <Link href={`/users/${user.userId}`} className="block min-w-0 hover:underline">
          <span className="text-ink block truncate font-medium">{user.displayName}</span>
          <span className="text-muted-foreground block truncate text-xs">{user.email}</span>
        </Link>
      </TableCell>
      <TableCell>
        {activeOrgs.length ? (
          <div className="flex items-start gap-1.5 text-xs">
            <Building2 className="text-muted-foreground mt-0.5 size-3.5 shrink-0" />
            <span>
              {activeOrgs.slice(0, 2).map((o) => (
                <span key={o.orgId} className="block">
                  {o.name} <span className="text-muted-foreground">· {o.role}</span>
                </span>
              ))}
              {activeOrgs.length > 2 && (
                <span className="text-muted-foreground block">+{activeOrgs.length - 2} more</span>
              )}
            </span>
          </div>
        ) : (
          <span className="text-muted-foreground flex items-center gap-1.5 text-xs">
            <User className="size-3.5" /> Individual
          </span>
        )}
      </TableCell>
      <TableCell>
        <div className="flex flex-wrap gap-1">
          {user.deactivatedAt ? (
            <Badge tone="danger">Suspended</Badge>
          ) : (
            <Badge tone="success">Active</Badge>
          )}
          {!user.emailVerified && <Badge tone="warning">Unverified</Badge>}
        </div>
      </TableCell>
      <TableCell className="text-muted-foreground text-xs whitespace-nowrap">
        {signInMethods(user)}
        {user.mfaEnabled && <span className="text-ink"> · 2FA</span>}
      </TableCell>
      <TableCell className="text-muted-foreground text-xs whitespace-nowrap">
        {formatDate(user.createdAt)}
      </TableCell>
      <TableCell className="text-muted-foreground text-xs whitespace-nowrap">
        {formatRelative(user.lastSignInAt)}
      </TableCell>
    </TableRow>
  );
};
