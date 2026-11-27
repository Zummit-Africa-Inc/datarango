"use client";

import { Search, ShieldCheck, Users } from "lucide-react";
import { useEffect, useState } from "react";

import { usePlatformRole, useUser } from "@datarango/auth";
import {
  Badge,
  Button,
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  Input,
  Label,
  PageLayout,
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
  Skeleton,
  Tabs,
  TabsContent,
  TabsList,
  TabsTrigger,
} from "@datarango/ui";

import {
  STAFF_ROLES,
  roleLabel,
  useGrantStaff,
  usePlatformUsers,
  useRevokeStaff,
  useStaff,
  type PlatformUser,
  type StaffMember,
  type StaffRole,
} from "@/hooks/people";

const PAGE_SIZE = 25;
const NO_ROLE = "none";

/** Everybody with an account, and the few who hold a platform role. */
export default function UsersPage() {
  const isAdmin = usePlatformRole("platform.admin");
  const canRead = usePlatformRole("platform.support");

  if (!canRead) {
    return (
      <PageLayout title="Users" subtitle="Everyone with a Datarango account.">
        <Notice
          title="You don't have support access"
          body="The user directory shows people's email addresses, so it needs the support or admin role."
        />
      </PageLayout>
    );
  }

  return (
    <PageLayout
      title="Users"
      subtitle="Everyone with a Datarango account, and who holds staff access."
    >
      <Tabs defaultValue="all">
        <TabsList>
          <TabsTrigger value="all">All users</TabsTrigger>
          <TabsTrigger value="staff">Staff</TabsTrigger>
        </TabsList>
        <TabsContent value="all" className="space-y-4 pt-4">
          <Directory isAdmin={isAdmin} />
        </TabsContent>
        <TabsContent value="staff" className="space-y-4 pt-4">
          {isAdmin ? (
            <StaffList />
          ) : (
            <Notice
              title="Admins only"
              body="Only a platform admin can see or change who holds staff access."
            />
          )}
        </TabsContent>
      </Tabs>
    </PageLayout>
  );
}

const Directory = ({ isAdmin }: { isAdmin: boolean }) => {
  const [input, setInput] = useState("");
  const [query, setQuery] = useState("");
  const [page, setPage] = useState(1);
  const [editing, setEditing] = useState<PlatformUser | null>(null);

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
    <>
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
        <Skeleton skeleton="table" rows={6} columns={4} />
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
          <div className="border-hairline text-muted-foreground grid min-w-[720px] grid-cols-[2fr_1fr_1fr_auto_auto] gap-4 border-b px-4 py-2 text-xs font-medium uppercase">
            <span>User</span>
            <span>Staff role</span>
            <span>Status</span>
            <span>Joined</span>
            <span className="sr-only">Actions</span>
          </div>
          {items.map((user) => (
            <div
              key={user.userId}
              className="border-hairline grid min-w-[720px] grid-cols-[2fr_1fr_1fr_auto_auto] items-center gap-4 border-b px-4 py-3 text-sm last:border-0"
            >
              <div className="min-w-0">
                <p className="text-ink truncate">{user.displayName}</p>
                <p className="text-muted-foreground truncate text-xs">{user.email}</p>
              </div>
              <div>
                {user.platformRole ? (
                  <Badge tone="primary">{roleLabel(user.platformRole)}</Badge>
                ) : (
                  <span className="text-muted-foreground text-xs">None</span>
                )}
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
                {new Date(user.createdAt).toLocaleDateString()}
              </span>
              {isAdmin ? (
                <Button size="sm" variant="ghost" onClick={() => setEditing(user)}>
                  Staff role
                </Button>
              ) : (
                <span />
              )}
            </div>
          ))}
        </div>
      )}

      {total > PAGE_SIZE && (
        <Pager page={page} pages={pages} total={total} onPage={setPage} noun="accounts" />
      )}

      {editing && (
        <RoleDialog
          email={editing.email}
          name={editing.displayName}
          userId={editing.userId}
          current={editing.platformRole}
          onClose={() => setEditing(null)}
        />
      )}
    </>
  );
};

const StaffList = () => {
  const { data, isLoading } = useStaff();
  const [editing, setEditing] = useState<StaffMember | null>(null);
  const [adding, setAdding] = useState(false);

  return (
    <>
      <div className="flex items-center justify-between gap-3">
        <p className="text-muted-foreground text-sm">
          Staff act for Datarango, not for any organisation. Keep this list short.
        </p>
        <Button size="sm" onClick={() => setAdding(true)}>
          Add staff
        </Button>
      </div>

      {isLoading ? (
        <Skeleton skeleton="table" rows={3} columns={3} />
      ) : (
        <div className="border-hairline bg-card overflow-x-auto rounded-xs border">
          <div className="border-hairline text-muted-foreground grid min-w-[600px] grid-cols-[2fr_1fr_auto_auto] gap-4 border-b px-4 py-2 text-xs font-medium uppercase">
            <span>Person</span>
            <span>Role</span>
            <span>Granted</span>
            <span className="sr-only">Actions</span>
          </div>
          {(data ?? []).map((member) => (
            <div
              key={member.userId}
              className="border-hairline grid min-w-[600px] grid-cols-[2fr_1fr_auto_auto] items-center gap-4 border-b px-4 py-3 text-sm last:border-0"
            >
              <div className="min-w-0">
                <p className="text-ink truncate">{member.displayName}</p>
                <p className="text-muted-foreground truncate text-xs">{member.email}</p>
              </div>
              <Badge tone="primary">{roleLabel(member.role)}</Badge>
              <span className="text-muted-foreground text-xs whitespace-nowrap">
                {new Date(member.grantedAt).toLocaleDateString()}
              </span>
              <Button size="sm" variant="ghost" onClick={() => setEditing(member)}>
                Change
              </Button>
            </div>
          ))}
        </div>
      )}

      {editing && (
        <RoleDialog
          email={editing.email}
          name={editing.displayName}
          userId={editing.userId}
          current={editing.role}
          onClose={() => setEditing(null)}
        />
      )}
      {adding && <RoleDialog onClose={() => setAdding(false)} />}
    </>
  );
};

/**
 * Grant, change or remove one person's staff role. With no person given it
 * asks for an email, which is how accounts identifies the grantee.
 */
const RoleDialog = ({
  email,
  name,
  userId,
  current,
  onClose,
}: {
  email?: string;
  name?: string;
  userId?: string;
  current?: StaffRole | null;
  onClose: () => void;
}) => {
  const me = useUser();
  const grant = useGrantStaff();
  const revoke = useRevokeStaff();

  const [target, setTarget] = useState(email ?? "");
  const [role, setRole] = useState<string>(current ?? NO_ROLE);

  const isSelf = !!userId && userId === me?.id;
  const busy = grant.isPending || revoke.isPending;
  const unchanged = role === (current ?? NO_ROLE);
  const removing = role === NO_ROLE && !!current;

  const save = () => {
    if (role === NO_ROLE) {
      if (userId) revoke.mutate({ userId }, { onSuccess: onClose });
      return;
    }
    grant.mutate({ email: target.trim(), role: role as StaffRole }, { onSuccess: onClose });
  };

  return (
    <Dialog open onOpenChange={(open) => !open && onClose()}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>{email ? `Staff role for ${name ?? email}` : "Add staff"}</DialogTitle>
          <DialogDescription>
            {email
              ? email
              : "They need a Datarango account first. Enter the email they signed up with."}
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4">
          {!email && (
            <div className="space-y-2">
              <Label htmlFor="staff-email">Email</Label>
              <Input
                id="staff-email"
                type="email"
                autoComplete="off"
                value={target}
                onChange={(e) => setTarget(e.target.value)}
              />
            </div>
          )}
          <div className="space-y-2">
            <Label htmlFor="staff-role">Role</Label>
            <Select value={role} onValueChange={setRole} disabled={isSelf}>
              <SelectTrigger id="staff-role">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {userId && <SelectItem value={NO_ROLE}>No staff access</SelectItem>}
                {STAFF_ROLES.map((r) => (
                  <SelectItem key={r.value} value={r.value}>
                    {r.label}: {r.description}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            {isSelf && (
              <p className="text-muted-foreground flex items-center gap-1 text-xs">
                <ShieldCheck className="size-3.5" />
                You can&apos;t change your own role. Ask another admin.
              </p>
            )}
          </div>
        </div>

        <DialogFooter>
          <Button variant="ghost" onClick={onClose}>
            Cancel
          </Button>
          <Button
            variant={removing ? "destructive" : "default"}
            disabled={busy || isSelf || unchanged || (role !== NO_ROLE && !target.trim())}
            onClick={save}
          >
            {removing ? "Remove access" : "Save"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};

const Pager = ({
  page,
  pages,
  total,
  noun,
  onPage,
}: {
  page: number;
  pages: number;
  total: number;
  noun: string;
  onPage: (page: number) => void;
}) => (
  <div className="flex items-center justify-between">
    <p className="text-muted-foreground text-sm">
      Page {page} of {pages} · {total} {noun}
    </p>
    <div className="flex gap-2">
      <Button size="sm" variant="outline" disabled={page <= 1} onClick={() => onPage(page - 1)}>
        Previous
      </Button>
      <Button size="sm" variant="outline" disabled={page >= pages} onClick={() => onPage(page + 1)}>
        Next
      </Button>
    </div>
  </div>
);

const Notice = ({ title, body, icon }: { title: string; body: string; icon?: React.ReactNode }) => (
  <div className="border-hairline bg-card rounded-xs border px-6 py-12 text-center">
    {icon}
    <p className="font-heading text-ink mt-3 text-lg">{title}</p>
    <p className="text-muted-foreground mx-auto mt-1 max-w-md text-sm">{body}</p>
  </div>
);
