"use client";

import { Copy, MoreHorizontal, UserCog } from "lucide-react";
import { useState } from "react";

import { useStaffPermission, useUser } from "@datarango/auth";
import {
  Badge,
  Button,
  Checkbox,
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
  Input,
  Label,
  PageLayout,
  Skeleton,
} from "@datarango/ui";

import { Notice, formatDate } from "@/components/people-ui";
import {
  conflictsIn,
  usePermissionCatalog,
  usePermissionLabel,
  useInviteStaff,
  useResendInvite,
  useSetStaffActive,
  useSetStaffRoles,
  useStaffAccounts,
  useStaffRoles,
  type StaffAccount,
  type StaffInvite,
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
  const [inviting, setInviting] = useState(false);
  const [editing, setEditing] = useState<StaffAccount | null>(null);
  const [link, setLink] = useState<StaffInvite | null>(null);

  const resend = useResendInvite();
  const setActive = useSetStaffActive();

  return (
    <div className="space-y-4">
      {canManage && (
        <div className="flex justify-end">
          <Button size="sm" onClick={() => setInviting(true)}>
            Invite staff
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
                        <DropdownMenuItem
                          onSelect={() =>
                            resend.mutate({ accountId: account.id }, { onSuccess: setLink })
                          }
                        >
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

      {inviting && (
        <InviteDialog
          onClose={() => setInviting(false)}
          onInvited={(invite) => {
            setInviting(false);
            setLink(invite);
          }}
        />
      )}
      {editing && <RolesDialog account={editing} onClose={() => setEditing(null)} />}
      {link && <InviteLinkDialog invite={link} onClose={() => setLink(null)} />}
    </div>
  );
};

/**
 * Role checkboxes. Accounts refuses roles carrying permissions the inviter
 * doesn't hold, and any set of roles that together hold both sides of a
 * segregation-of-duties pair, so a role that would complete a pair with the
 * ones already ticked is greyed out with the reason. Super admin is exempt:
 * with it ticked, nothing else is limited.
 */
const RolePicker = ({
  selected,
  onChange,
}: {
  selected: string[];
  onChange: (ids: string[]) => void;
}) => {
  const { data: roles, isLoading } = useStaffRoles();
  const { data: catalog } = usePermissionCatalog();
  const label = usePermissionLabel();
  if (isLoading) return <Skeleton skeleton="table" rows={2} columns={1} />;

  const all = roles ?? [];
  const rules = catalog?.conflicts ?? [];
  const superAdmin = all.some((r) => r.isSystem && selected.includes(r.id));
  const permsOf = (ids: string[]) =>
    all.filter((r) => ids.includes(r.id) && !r.isSystem).flatMap((r) => r.permissions);
  const broken = superAdmin ? [] : conflictsIn(rules, permsOf(selected));

  return (
    <fieldset className="space-y-2">
      <legend className="text-sm font-medium">Roles</legend>
      {broken.length > 0 && (
        <p className="text-danger text-sm" role="alert">
          These roles together break segregation of duties. Untick one to save.
        </p>
      )}
      {all.map((role) => {
        const id = `role-${role.id}`;
        const checked = selected.includes(role.id);
        // What ticking this role would break, given the others.
        const clash =
          checked || superAdmin || role.isSystem
            ? undefined
            : conflictsIn(rules, [...permsOf(selected), ...role.permissions]).find(
                (c) => !broken.includes(c),
              );
        return (
          <div key={role.id} className="flex items-start gap-2">
            <Checkbox
              id={id}
              className="mt-0.5"
              checked={checked}
              disabled={!!clash}
              onCheckedChange={(v) =>
                onChange(
                  v === true ? [...selected, role.id] : selected.filter((r) => r !== role.id),
                )
              }
            />
            <Label htmlFor={id} className="leading-tight font-normal">
              <span className="text-ink block">{role.name}</span>
              {role.description && (
                <span className="text-muted-foreground block text-xs">{role.description}</span>
              )}
              {clash && (
                <span className="text-warning mt-1 block text-xs">
                  Would give both {label(clash.first)} and {label(clash.second)}. {clash.reason}
                </span>
              )}
            </Label>
          </div>
        );
      })}
    </fieldset>
  );
};

const InviteDialog = ({
  onClose,
  onInvited,
}: {
  onClose: () => void;
  onInvited: (invite: StaffInvite) => void;
}) => {
  const invite = useInviteStaff();
  const [email, setEmail] = useState("");
  const [name, setName] = useState("");
  const [roleIds, setRoleIds] = useState<string[]>([]);

  const valid = /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email.trim()) && name.trim().length > 0;

  return (
    <Dialog open onOpenChange={(open) => !open && onClose()}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Invite staff</DialogTitle>
          <DialogDescription>
            They get an email with the admin sign-in link. They sign in with their Trustaige account
            for this email; there is no password to set. Their first sign-in ties this account to
            that Trustaige identity.
          </DialogDescription>
        </DialogHeader>
        <div className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="invite-name">Name</Label>
            <Input id="invite-name" value={name} onChange={(e) => setName(e.target.value)} />
          </div>
          <div className="space-y-2">
            <Label htmlFor="invite-email">Work email</Label>
            <Input
              id="invite-email"
              type="email"
              autoComplete="off"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
            />
          </div>
          <RolePicker selected={roleIds} onChange={setRoleIds} />
        </div>
        <DialogFooter>
          <Button variant="ghost" onClick={onClose}>
            Cancel
          </Button>
          <Button
            disabled={!valid || invite.isPending}
            onClick={() =>
              invite.mutate(
                { email: email.trim(), displayName: name.trim(), roleIds },
                { onSuccess: onInvited },
              )
            }
          >
            {invite.isPending ? "Sending…" : "Send invite"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
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

/** The link is emailed too; this is for when the email doesn't arrive. */
const InviteLinkDialog = ({ invite, onClose }: { invite: StaffInvite; onClose: () => void }) => (
  <Dialog open onOpenChange={(open) => !open && onClose()}>
    <DialogContent>
      <DialogHeader>
        <DialogTitle>Invite sent to {invite.account.email}</DialogTitle>
        <DialogDescription>
          If the email doesn&apos;t arrive, send them this link yourself. It is just the admin
          sign-in page: only the Trustaige account for {invite.account.email} gets in.
        </DialogDescription>
      </DialogHeader>
      <p className="border-border bg-background-subtle rounded-lg border p-3 font-mono text-xs break-all select-all">
        {invite.inviteLink}
      </p>
      <DialogFooter>
        <Button
          variant="secondary"
          onClick={() => navigator.clipboard?.writeText(invite.inviteLink)}
        >
          <Copy className="size-4" /> Copy link
        </Button>
        <Button onClick={onClose}>Done</Button>
      </DialogFooter>
    </DialogContent>
  </Dialog>
);
