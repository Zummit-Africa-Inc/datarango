"use client";

import { Search, Users } from "lucide-react";
import { useEffect, useState } from "react";

import { useStaffPermission } from "@datarango/auth";
import { Badge, Input, PageLayout, Skeleton } from "@datarango/ui";

import { Notice, Pager, formatDate } from "@/components/people-ui";
import { usePlatformUsers } from "@/hooks/people";

const PAGE_SIZE = 25;

/** Everybody with a Datarango user account. Staff accounts are separate and live on the Staff page. */
export default function UsersPage() {
  const canRead = useStaffPermission("users.view");

  return (
    <PageLayout title="Users" subtitle="Everyone with a Datarango account.">
      {canRead ? (
        <Directory />
      ) : (
        <Notice
          title="You can't see the user directory"
          body="It shows people's email addresses, so it needs the users.view permission."
        />
      )}
    </PageLayout>
  );
}

const Directory = () => {
  const [input, setInput] = useState("");
  const [query, setQuery] = useState("");
  const [page, setPage] = useState(1);

  // Debounced so each keystroke isn't a directory query.
  useEffect(() => {
    const timer = setTimeout(() => {
      setQuery(input.trim());
      setPage(1);
    }, 300);
    return () => clearTimeout(timer);
  }, [input]);

  const { data, isLoading } = usePlatformUsers({ query, page, pageSize: PAGE_SIZE });
  const items = data?.items ?? [];
  const total = data?.total ?? 0;
  const pages = Math.max(1, Math.ceil(total / PAGE_SIZE));

  return (
    <div className="space-y-4">
      <div className="relative max-w-sm">
        <Search className="text-muted-foreground pointer-events-none absolute top-1/2 left-3 z-10 size-4 -translate-y-1/2" />
        <Input
          aria-label="Search users"
          className="pl-9"
          placeholder="Search by name or email"
          value={input}
          onChange={(e) => setInput(e.target.value)}
        />
      </div>

      {isLoading ? (
        <Skeleton skeleton="table" rows={6} columns={3} />
      ) : items.length === 0 ? (
        <Notice
          icon={<Users className="text-muted-foreground mx-auto size-8" strokeWidth={1.5} />}
          title={query ? "No one matches that search" : "No accounts yet"}
          body={
            query
              ? "Try part of their email address or name."
              : "Accounts appear here as people sign up."
          }
        />
      ) : (
        <div className="border-hairline bg-card overflow-x-auto rounded-xs border">
          <div className="border-hairline text-muted-foreground grid min-w-150 grid-cols-[2fr_1fr_auto] gap-4 border-b px-4 py-2 text-xs font-medium uppercase">
            <span>User</span>
            <span>Status</span>
            <span>Joined</span>
          </div>
          {items.map((user) => (
            <div
              key={user.userId}
              className="border-hairline grid min-w-150 grid-cols-[2fr_1fr_auto] items-center gap-4 border-b px-4 py-3 text-sm last:border-0"
            >
              <div className="min-w-0">
                <p className="text-ink truncate">{user.displayName}</p>
                <p className="text-muted-foreground truncate text-xs">{user.email}</p>
              </div>
              <div className="flex flex-wrap gap-1">
                {user.deactivatedAt ? (
                  <Badge tone="danger">Deactivated</Badge>
                ) : (
                  <Badge tone="success">Active</Badge>
                )}
                {!user.emailVerified && <Badge tone="warning">Unverified</Badge>}
              </div>
              <span className="text-muted-foreground text-xs whitespace-nowrap">
                {formatDate(user.createdAt)}
              </span>
            </div>
          ))}
        </div>
      )}

      {total > PAGE_SIZE && (
        <Pager page={page} pages={pages} total={total} onPage={setPage} noun="accounts" />
      )}
    </div>
  );
};
