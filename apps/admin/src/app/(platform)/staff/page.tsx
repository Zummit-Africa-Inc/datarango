"use client";

import { MoreHorizontal, UserCog } from "lucide-react";
import Link from "next/link";
import { useState } from "react";

import { useStaffPermission, useUser } from "@datarango/auth";
import {
  Badge,
  Button,
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
  PageLayout,
  Skeleton,
} from "@datarango/ui";

import { Notice, formatDate } from "@/components/people-ui";
import { RolePicker } from "@/components/role-picker";
import {
  useResendInvite,
  useSetStaffActive,
  useSetStaffRoles,
  useStaffAccounts,
  type StaffAccount,
  type StaffStatus,
} from "@/hooks/people";

const STATUS: Record<StaffStatus, { label: string; tone: "success" | "warning" | "danger" }> = {
  active: { label: "Active", tone: "success" },
  invited: { label: "Invited", tone: "warning" },
  deactivated: { label: "Deactivated", tone: "danger" },
};

/** Staff accounts: separate from users, invited by email, each holding custom roles. */
export default function StaffPage() {
  const canView = useStaffPermission("staff:accounts:view");
  const canManage = useStaffPermission("staff:accounts:manage");

  return (
    <PageLayout
      title="Staff"
      subtitle="People who can sign in to Datarango Admin. Keep this list short."
    >
      {canView || canManage ? (
        <StaffList canManage={canManage} />
      ) : (
        <Notice
          title="You can't see staff"
          body="Seeing staff accounts needs the staff:accounts:view permission."
        />
      )}
    </PageLayout>
  );
}

const StaffList = ({ canManage }: { canManage: boolean }) => {
  const me = useUser();
  const { data, isLoading } = useStaffAccounts();
  const [editing, setEditing] = useState<StaffAccount | null>(null);

  const resend = useResendInvite();
  const setActive = useSetStaffActive();

  return (
    <div className="space-y-4">
      {canManage && (
        <div className="flex justify-end">
          <Button asChild size="sm">
            <Link href="/staff/new">Invite staff</Link>
          </Button>
        </div>
      )}

      {isLoading ? (
        <Skeleton skeleton="table" rows={3} columns={4} />
      ) : !data?.length ? (
        <Notice
          icon={<UserCog className="text-muted-foreground mx-auto size-8" strokeWidth={1.5} />}
          title="No staff yet"
          body="Invite someone to give them an admin account."
        />
      ) : (
        <div className="border-hairline bg-card overflow-x-auto rounded-xs border">
          <div className="border-hairline text-muted-foreground grid min-w-180 grid-cols-[2fr_2fr_1fr_auto_auto] gap-4 border-b px-4 py-2 text-xs font-medium uppercase">
            <span>Person</span>
            <span>Roles</span>
            <span>Status</span>
            <span>Last sign-in</span>
            <span className="sr-only">Actions</span>
          </div>
          {data.map((account) => {
            const isSelf = account.id === me?.id;
            return (
              <div
                key={account.id}
                className="border-hairline grid min-w-180 grid-cols-[2fr_2fr_1fr_auto_auto] items-center gap-4 border-b px-4 py-3 text-sm last:border-0"
              >
                <div className="min-w-0">
                  <p className="text-ink truncate">
                    {account.displayName}
                    {isSelf && <span className="text-muted-foreground"> (you)</span>}
                  </p>
                  <p className="text-muted-foreground truncate text-xs">{account.email}</p>
                </div>
                <div className="flex flex-wrap gap-1">
                  {account.roles.length ? (
                    account.roles.map((r) => (
                      <Badge key={r.id} tone="primary">
                        {r.name}
                      </Badge>
                    ))
                  ) : (
                    <span className="text-muted-foreground text-xs">No roles</span>
                  )}
                </div>
                <div className="flex flex-wrap gap-1">
                  <Badge tone={STATUS[account.status].tone}>{STATUS[account.status].label}</Badge>
                  {account.conflicts.length > 0 && (
                    <Badge tone="danger" title="Their roles together break segregation of duties">
                      Conflict
                    </Badge>
                  )}
                </div>
                <span className="text-muted-foreground text-xs whitespace-nowrap">
                  {formatDate(account.lastSignInAt)}
                </span>
                {isSelf || !canManage ? (
                  <span />
                ) : (
                  <DropdownMenu>
                    <DropdownMenuTrigger asChild>
                      <Button aria-label={`Actions for ${account.email}`} size="sm" variant="ghost">
                        <MoreHorizontal className="size-4" />
                      </Button>
                    </DropdownMenuTrigger>
                    <DropdownMenuContent align="end">
                      <DropdownMenuItem onSelect={() => setEditing(account)}>
                        Change roles
                      </DropdownMenuItem>
                      {account.status === "invited" && (
                        <DropdownMenuItem onSelect={() => resend.mutate({ accountId: account.id })}>
                          Resend invite
                        </DropdownMenuItem>
                      )}
                      <DropdownMenuSeparator />
                      <DropdownMenuItem
                        onSelect={() =>
                          setActive.mutate({
                            accountId: account.id,
                            active: account.status === "deactivated",
                          })
                        }
                      >
                        {account.status === "deactivated" ? "Reactivate" : "Deactivate"}
                      </DropdownMenuItem>
                    </DropdownMenuContent>
                  </DropdownMenu>
                )}
              </div>
            );
          })}
        </div>
      )}

      {editing && <RolesDialog account={editing} onClose={() => setEditing(null)} />}
    </div>
  );
};

const RolesDialog = ({ account, onClose }: { account: StaffAccount; onClose: () => void }) => {
  const save = useSetStaffRoles();
  const [roleIds, setRoleIds] = useState(account.roles.map((r) => r.id));

  return (
    <Dialog open onOpenChange={(open) => !open && onClose()}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Roles for {account.displayName}</DialogTitle>
          <DialogDescription>{account.email}</DialogDescription>
        </DialogHeader>
        <RolePicker selected={roleIds} onChange={setRoleIds} />
        <DialogFooter>
          <Button variant="ghost" onClick={onClose}>
            Cancel
          </Button>
          <Button
            disabled={save.isPending}
            onClick={() => save.mutate({ accountId: account.id, roleIds }, { onSuccess: onClose })}
          >
            Save
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};
