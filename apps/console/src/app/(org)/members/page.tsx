"use client";

import { useState } from "react";

import { useActiveOrg, usePermission } from "@datarango/auth";
import { Button, Input, PageLayout, Skeleton } from "@datarango/ui";

import {
  useChangeMemberRole,
  useDeactivateMember,
  useInviteMember,
  useOrgMembers,
  useOrgRoles,
} from "@/hooks/orgs";

const short = (id: string) => `${id.slice(0, 8)}…`;

export default function MembersPage() {
  const { activeOrgId } = useActiveOrg();
  const orgId = activeOrgId ?? "";

  const canInvite = usePermission("org.members.invite");
  const canManage = usePermission("org.members.manage");

  const { data: members, isLoading } = useOrgMembers(activeOrgId);
  const { data: roles } = useOrgRoles(activeOrgId);
  const invite = useInviteMember(orgId);
  const changeRole = useChangeMemberRole(orgId);
  const deactivate = useDeactivateMember(orgId);

  const [email, setEmail] = useState("");
  const [inviteRole, setInviteRole] = useState("member");

  // Roles a member can be assigned (owner is never assignable).
  const assignable = (roles ?? []).map((r) => r.name).filter((r) => r !== "owner");

  const sendInvite = (e: React.FormEvent) => {
    e.preventDefault();
    if (!email.includes("@")) return;
    invite.mutate({ email: email.trim(), role: inviteRole }, { onSuccess: () => setEmail("") });
  };

  return (
    <PageLayout title="Members" subtitle="Invite people and manage their roles.">
      {canInvite && (
        <form
          onSubmit={sendInvite}
          className="border-hairline bg-card flex flex-wrap items-end gap-3 rounded-xs border p-4"
        >
          <div className="min-w-56 flex-1 space-y-1.5">
            <label className="text-sm font-medium" htmlFor="invite-email">
              Invite by email
            </label>
            <Input
              id="invite-email"
              type="email"
              placeholder="person@example.com"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
            />
          </div>
          <select
            className="border-input bg-background h-9 rounded-xs border px-2 text-sm"
            value={inviteRole}
            onChange={(e) => setInviteRole(e.target.value)}
            aria-label="Invite role"
          >
            {(assignable.length ? assignable : ["admin", "manager", "instructor", "member"]).map(
              (r) => (
                <option key={r} value={r}>
                  {r}
                </option>
              ),
            )}
          </select>
          <Button type="submit" disabled={invite.isPending || !email.includes("@")}>
            {invite.isPending ? "Sending…" : "Send invite"}
          </Button>
        </form>
      )}

      {isLoading ? (
        <Skeleton skeleton="table" rows={5} columns={4} />
      ) : (
        <div className="border-hairline bg-card overflow-hidden rounded-xs border">
          <div className="border-hairline text-muted-foreground grid grid-cols-[1fr_auto_auto_auto] gap-4 border-b px-4 py-2 text-xs font-medium uppercase">
            <span>Member</span>
            <span>Role</span>
            <span>Status</span>
            <span className="text-right">Actions</span>
          </div>
          {(members ?? []).map((m) => (
            <div
              key={m.userId}
              className="border-hairline grid grid-cols-[1fr_auto_auto_auto] items-center gap-4 border-b px-4 py-3 text-sm last:border-0"
            >
              <span className="font-mono text-xs">{short(m.userId)}</span>
              {canManage && m.role !== "owner" ? (
                <select
                  className="border-input bg-background h-8 rounded-xs border px-2 text-sm"
                  value={m.role}
                  onChange={(e) =>
                    changeRole.mutate({ targetUserId: m.userId, role: e.target.value })
                  }
                  aria-label={`Role for ${short(m.userId)}`}
                >
                  {[...new Set([m.role, ...assignable])].map((r) => (
                    <option key={r} value={r}>
                      {r}
                    </option>
                  ))}
                </select>
              ) : (
                <span className="capitalize">{m.role}</span>
              )}
              <span className={m.active ? "text-emerald-600" : "text-muted-foreground"}>
                {m.active ? "Active" : "Inactive"}
              </span>
              <div className="text-right">
                {canManage && m.role !== "owner" && m.active && (
                  <Button
                    size="sm"
                    variant="ghost"
                    onClick={() => deactivate.mutate({ targetUserId: m.userId })}
                  >
                    Remove
                  </Button>
                )}
              </div>
            </div>
          ))}
          {(members ?? []).length === 0 && (
            <p className="text-muted-foreground px-4 py-6 text-center text-sm">No members yet.</p>
          )}
        </div>
      )}
    </PageLayout>
  );
}
