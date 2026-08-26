"use client";

import { useMemo, useState } from "react";
import { Lock, Plus, Shield, Trash2 } from "lucide-react";

import { useActiveOrg, usePermission } from "@datarango/auth";
import { Badge, Button, Checkbox, Input, Label, PageLayout, Skeleton } from "@datarango/ui";

import {
  permissionGroup,
  permissionLabel,
  useCreateRole,
  useDeleteRole,
  useOrgMembers,
  useOrgPermissionCatalog,
  useOrgRoles,
  useUpdateRole,
  type OrgRole,
} from "@/hooks/orgs";

/**
 * Custom roles.
 *
 * `/roles` was in the console nav and 404'd, while accounts has had full role
 * CRUD and a permission catalog behind `/orgs/{orgId}/roles` since Phase 1 —
 * so an org could be given custom roles and had no way to define one. Same
 * "built and unreachable" shape as the SSO config CRUD, the media module and the
 * notification inbox.
 *
 * Built-in roles are shown but not editable: their bundles are the fallback a
 * membership resolves to and are defined in code, so letting one be rewritten
 * here would put the UI and `OrgRoles.Bundles` permanently out of step.
 */
export default function RolesPage() {
  const { activeOrgId } = useActiveOrg();
  const orgId = activeOrgId ?? "";

  const canManage = usePermission("org.roles.manage");
  const canViewMembers = usePermission("org.members.view");

  const { data: roles, isLoading } = useOrgRoles(activeOrgId);
  const { data: catalog } = useOrgPermissionCatalog();
  const { data: members } = useOrgMembers(canViewMembers ? activeOrgId : null);

  const [draftFor, setDraftFor] = useState<string | null>(null);

  const permissions = catalog?.permissions ?? [];
  const builtIn = (roles ?? []).filter((r) => r.builtIn);
  const custom = (roles ?? []).filter((r) => !r.builtIn);

  /** How many people hold each role, so deleting one isn't a blind act. */
  const holdersByRole = useMemo(() => {
    const counts = new Map<string, number>();
    for (const member of members ?? []) {
      if (!member.active) continue;
      counts.set(member.role, (counts.get(member.role) ?? 0) + 1);
    }
    return counts;
  }, [members]);

  if (!activeOrgId) {
    return (
      <PageLayout title="Roles" subtitle="Pick an organisation to manage its roles.">
        <p className="text-muted-foreground border-hairline bg-card rounded-xs border px-4 py-8 text-center text-sm">
          No organisation selected.
        </p>
      </PageLayout>
    );
  }

  if (!canManage) {
    return (
      <PageLayout title="Roles" subtitle="What each role in this organisation can do.">
        <div className="border-hairline bg-muted/40 rounded-xs border px-4 py-3 text-sm">
          <p className="text-ink font-medium">You can&apos;t manage roles here</p>
          <p className="text-muted-foreground mt-1">
            Editing roles needs the <code className="font-code text-xs">org.roles.manage</code>{" "}
            permission — ask an owner or admin.
          </p>
        </div>
        <RoleList roles={roles ?? []} readOnly holdersByRole={holdersByRole} />
      </PageLayout>
    );
  }

  return (
    <PageLayout
      title="Roles"
      subtitle="What each role in this organisation can do."
      actions={[
        <Button key="new" onClick={() => setDraftFor("new")} disabled={draftFor === "new"}>
          <Plus className="size-4" />
          New role
        </Button>,
      ]}
    >
      {isLoading ? (
        <Skeleton skeleton="table" rows={4} columns={3} />
      ) : (
        <>
          {draftFor === "new" && (
            <RoleEditor orgId={orgId} catalog={permissions} onDone={() => setDraftFor(null)} />
          )}

          <section>
            <div className="mb-3">
              <h2 className="font-heading text-ink text-lg">Custom roles</h2>
              <p className="text-muted-foreground mt-0.5 text-sm">
                Defined by this organisation. A member holding one gets exactly these permissions.
              </p>
            </div>
            {custom.length === 0 ? (
              <p className="text-muted-foreground border-hairline bg-card rounded-xs border px-4 py-8 text-center text-sm">
                No custom roles yet — the built-in ones below cover most organisations.
              </p>
            ) : (
              <ul className="space-y-3">
                {custom.map((role) =>
                  draftFor === role.id ? (
                    <li key={role.id}>
                      <RoleEditor
                        orgId={orgId}
                        catalog={permissions}
                        existing={role}
                        onDone={() => setDraftFor(null)}
                      />
                    </li>
                  ) : (
                    <li key={role.id}>
                      <RoleCard
                        role={role}
                        holders={holdersByRole.get(role.name) ?? 0}
                        orgId={orgId}
                        onEdit={() => setDraftFor(role.id)}
                      />
                    </li>
                  ),
                )}
              </ul>
            )}
          </section>

          <section>
            <div className="mb-3">
              <h2 className="font-heading text-ink text-lg">Built-in roles</h2>
              <p className="text-muted-foreground mt-0.5 text-sm">
                Defined by the platform and not editable — these bundles are what a membership falls
                back to, so they have to mean the same thing everywhere.
              </p>
            </div>
            <RoleList roles={builtIn} readOnly holdersByRole={holdersByRole} />
          </section>
        </>
      )}
    </PageLayout>
  );
}

const RoleList = ({
  roles,
  readOnly,
  holdersByRole,
}: {
  roles: OrgRole[];
  readOnly: boolean;
  holdersByRole: Map<string, number>;
}) =>
  roles.length === 0 ? (
    <p className="text-muted-foreground border-hairline bg-card rounded-xs border px-4 py-8 text-center text-sm">
      No roles to show.
    </p>
  ) : (
    <ul className="space-y-3">
      {roles.map((role) => (
        <li key={role.id}>
          <RoleCard role={role} holders={holdersByRole.get(role.name) ?? 0} readOnly={readOnly} />
        </li>
      ))}
    </ul>
  );

const RoleCard = ({
  role,
  holders,
  orgId,
  onEdit,
  readOnly,
}: {
  role: OrgRole;
  holders: number;
  orgId?: string;
  onEdit?: () => void;
  readOnly?: boolean;
}) => {
  const remove = useDeleteRole(orgId ?? "");
  const [confirming, setConfirming] = useState(false);

  return (
    <div className="border-hairline bg-card rounded-xs border p-4">
      <div className="flex flex-wrap items-center gap-3">
        {role.builtIn ? (
          <Lock className="text-muted-foreground size-4 shrink-0" aria-label="Built in" />
        ) : (
          <Shield className="text-muted-foreground size-4 shrink-0" />
        )}
        <span className="text-ink min-w-0 flex-1 truncate font-medium">{role.name}</span>
        {role.builtIn && <Badge variant="ghost">built-in</Badge>}
        <span className="text-muted-foreground shrink-0 text-xs">
          {holders} {holders === 1 ? "member" : "members"}
        </span>

        {!readOnly && !role.builtIn && (
          <>
            <Button size="sm" variant="outline" onClick={onEdit}>
              Edit
            </Button>
            {confirming ? (
              <span className="flex shrink-0 items-center gap-2">
                <Button size="sm" variant="ghost" onClick={() => setConfirming(false)}>
                  Cancel
                </Button>
                <Button
                  size="sm"
                  disabled={remove.isPending}
                  onClick={() => remove.mutate({ roleId: role.id })}
                >
                  {remove.isPending ? "Deleting…" : "Delete"}
                </Button>
              </span>
            ) : (
              <Button
                size="icon-sm"
                variant="ghost"
                // The server refuses (`org.role_in_use`) while anyone holds it,
                // so this is disabled rather than offered-and-rejected — and the
                // reason sits below instead of arriving as a toast after a click.
                disabled={holders > 0}
                title={
                  holders > 0
                    ? "Reassign the members holding this role before deleting it."
                    : undefined
                }
                aria-label={`Delete ${role.name}`}
                onClick={() => setConfirming(true)}
              >
                <Trash2 className="size-3.5" />
              </Button>
            )}
          </>
        )}
      </div>

      {!readOnly && !role.builtIn && holders > 0 && (
        <p className="text-muted-foreground mt-2 text-sm">
          Can&apos;t be deleted while {holders === 1 ? "someone holds" : `${holders} members hold`}{" "}
          it — move them to another role first, so nobody is left on a role that no longer exists.
        </p>
      )}

      {role.permissions.length === 0 ? (
        <p className="text-muted-foreground mt-2 text-sm">
          No permissions — a member holding this can sign in and see nothing else.
        </p>
      ) : (
        <ul className="mt-3 flex flex-wrap gap-1.5">
          {role.permissions.map((permission) => (
            <li key={permission}>
              <Badge variant="outline">{permissionLabel(permission)}</Badge>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
};

/**
 * Create or edit one role.
 *
 * Permissions are grouped by their own namespace rather than a hand-kept list,
 * so a permission the platform adds tomorrow lands in a sensible group without
 * this file changing.
 */
const RoleEditor = ({
  orgId,
  catalog,
  existing,
  onDone,
}: {
  orgId: string;
  catalog: string[];
  existing?: OrgRole;
  onDone: () => void;
}) => {
  const create = useCreateRole(orgId);
  const update = useUpdateRole(orgId);

  const [name, setName] = useState(existing?.name ?? "");
  const [selected, setSelected] = useState<Set<string>>(new Set(existing?.permissions ?? []));

  const grouped = useMemo(() => {
    const groups = new Map<string, string[]>();
    for (const permission of catalog) {
      const group = permissionGroup(permission);
      groups.set(group, [...(groups.get(group) ?? []), permission]);
    }
    return [...groups.entries()].sort(([a], [b]) => a.localeCompare(b));
  }, [catalog]);

  const toggle = (permission: string) =>
    setSelected((current) => {
      const next = new Set(current);
      if (next.has(permission)) next.delete(permission);
      else next.add(permission);
      return next;
    });

  const pending = create.isPending || update.isPending;
  const valid = name.trim().length > 0;

  const submit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!valid) return;
    const payload = { name: name.trim(), permissions: [...selected] };
    const done = { onSuccess: () => onDone() };
    if (existing) update.mutate({ roleId: existing.id, ...payload }, done);
    else create.mutate(payload, done);
  };

  return (
    <form onSubmit={submit} className="border-hairline bg-card space-y-4 rounded-xs border p-4">
      <div>
        <Label htmlFor="role-name">Role name</Label>
        <p className="text-muted-foreground mt-1 text-xs">
          What members see next to their name. Avoid reusing a built-in name — a membership resolves
          by name, so it would be ambiguous which bundle applies.
        </p>
        <Input
          id="role-name"
          value={name}
          onChange={(e) => setName(e.target.value)}
          placeholder="Training coordinator"
          className="mt-2"
          autoFocus
        />
      </div>

      <div>
        <Label>Permissions</Label>
        <p className="text-muted-foreground mt-1 text-xs">
          Exactly what a member holding this role can do. Nothing is implied — an empty role grants
          nothing.
        </p>
        <div className="mt-3 grid gap-4 sm:grid-cols-2">
          {grouped.map(([group, groupPermissions]) => (
            <div key={group}>
              <p className="text-muted-foreground text-xs font-medium capitalize">{group}</p>
              <ul className="mt-1.5 space-y-1.5">
                {groupPermissions.map((permission) => (
                  <li className="flex items-center gap-2" key={permission}>
                    <Checkbox
                      id={`perm-${permission}`}
                      checked={selected.has(permission)}
                      onCheckedChange={() => toggle(permission)}
                    />
                    <label className="text-sm" htmlFor={`perm-${permission}`}>
                      {permissionLabel(permission)}
                    </label>
                  </li>
                ))}
              </ul>
            </div>
          ))}
        </div>
      </div>

      <div className="flex items-center justify-end gap-2">
        <span className="text-muted-foreground mr-auto text-xs">
          {selected.size} of {catalog.length} permissions
        </span>
        <Button type="button" variant="ghost" onClick={onDone}>
          Cancel
        </Button>
        <Button type="submit" disabled={!valid || pending}>
          {pending ? "Saving…" : existing ? "Save role" : "Create role"}
        </Button>
      </div>
    </form>
  );
};
