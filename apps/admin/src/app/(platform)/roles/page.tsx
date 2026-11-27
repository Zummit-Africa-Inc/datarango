"use client";

import { KeyRound, Lock } from "lucide-react";
import { useMemo, useState } from "react";

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
  Input,
  Label,
  PageLayout,
  Skeleton,
  Textarea,
} from "@datarango/ui";

import { Notice } from "@/components/people-ui";
import {
  moduleTitle,
  useCreateRole,
  useDeleteRole,
  usePermissionCatalog,
  usePermissionLabel,
  useStaffRoles,
  useUpdateRole,
  type StaffRole,
} from "@/hooks/people";

/** Custom staff roles, each a set of permissions from the catalog. */
export default function RolesPage() {
  const canView = useStaffPermission("staff:roles:view");
  const canManage = useStaffPermission("staff:roles:manage");

  return (
    <PageLayout
      title="Staff roles"
      subtitle="What each role lets a staff account do. A person's access is every permission across their roles."
    >
      {canView || canManage ? (
        <Roles canManage={canManage} />
      ) : (
        <Notice
          title="You can't see staff roles"
          body="Seeing roles needs the staff:roles:view permission."
        />
      )}
    </PageLayout>
  );
}

const Roles = ({ canManage }: { canManage: boolean }) => {
  const { data, isLoading } = useStaffRoles();
  const permissionLabel = usePermissionLabel();
  const [editing, setEditing] = useState<StaffRole | "new" | null>(null);

  return (
    <div className="space-y-4">
      {canManage && (
        <div className="flex justify-end">
          <Button size="sm" onClick={() => setEditing("new")}>
            New role
          </Button>
        </div>
      )}

      {isLoading ? (
        <Skeleton skeleton="table" rows={3} columns={3} />
      ) : !data?.length ? (
        <Notice
          icon={<KeyRound className="text-muted-foreground mx-auto size-8" strokeWidth={1.5} />}
          title="No roles"
          body="Create a role to give staff a set of permissions."
        />
      ) : (
        <div className="grid gap-3 md:grid-cols-2">
          {data.map((role) => (
            <div key={role.id} className="border-hairline bg-card rounded-xs border p-4">
              <div className="flex items-start justify-between gap-3">
                <div className="min-w-0">
                  <p className="text-ink flex items-center gap-1.5 font-medium">
                    {role.isSystem && <Lock className="text-muted-foreground size-3.5" />}
                    {role.name}
                  </p>
                  {role.description && (
                    <p className="text-muted-foreground mt-0.5 text-sm">{role.description}</p>
                  )}
                </div>
                {canManage && !role.isSystem && (
                  <Button size="sm" variant="ghost" onClick={() => setEditing(role)}>
                    Edit
                  </Button>
                )}
              </div>
              <div className="mt-3 flex flex-wrap gap-1">
                {role.isSystem ? (
                  <Badge tone="primary">Every permission</Badge>
                ) : role.permissions.length ? (
                  role.permissions.map((p) => (
                    <Badge key={p} appearance="outline" tone="neutral">
                      {permissionLabel(p)}
                    </Badge>
                  ))
                ) : (
                  <span className="text-muted-foreground text-xs">No permissions</span>
                )}
              </div>
              <p className="text-muted-foreground mt-3 text-xs">
                {role.memberCount === 1 ? "1 person" : `${role.memberCount} people`}
              </p>
            </div>
          ))}
        </div>
      )}

      {editing && (
        <RoleDialog role={editing === "new" ? null : editing} onClose={() => setEditing(null)} />
      )}
    </div>
  );
};

/**
 * Create or edit a role. Only permissions the editor holds can be ticked:
 * accounts refuses anything else, so the dialog says so up front.
 */
const RoleDialog = ({ role, onClose }: { role: StaffRole | null; onClose: () => void }) => {
  const me = useUser();
  const { data: catalog } = usePermissionCatalog();
  const create = useCreateRole();
  const update = useUpdateRole();
  const remove = useDeleteRole();

  const [name, setName] = useState(role?.name ?? "");
  const [description, setDescription] = useState(role?.description ?? "");
  const [permissions, setPermissions] = useState<string[]>(role?.permissions ?? []);

  const held = useMemo(() => new Set<string>(me?.staffPermissions ?? []), [me]);
  // Catalog order, grouped by module (the key's first segment).
  const groups = useMemo(() => {
    const out = new Map<string, NonNullable<typeof catalog>>();
    for (const p of catalog ?? []) out.set(p.module, [...(out.get(p.module) ?? []), p]);
    return [...out.entries()];
  }, [catalog]);

  const busy = create.isPending || update.isPending || remove.isPending;
  const body = { name: name.trim(), description: description.trim(), permissions };

  const save = () =>
    role
      ? update.mutate({ roleId: role.id, ...body }, { onSuccess: onClose })
      : create.mutate(body, { onSuccess: onClose });

  return (
    <Dialog open onOpenChange={(open) => !open && onClose()}>
      <DialogContent className="max-h-[90dvh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>{role ? `Edit ${role.name}` : "New role"}</DialogTitle>
          <DialogDescription>You can only include permissions you hold yourself.</DialogDescription>
        </DialogHeader>

        <div className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="role-name">Name</Label>
            <Input id="role-name" value={name} onChange={(e) => setName(e.target.value)} />
          </div>
          <div className="space-y-2">
            <Label htmlFor="role-description">Description</Label>
            <Textarea
              id="role-description"
              rows={2}
              value={description}
              onChange={(e) => setDescription(e.target.value)}
            />
          </div>
          {groups.map(([module, items]) => (
            <fieldset key={module} className="space-y-2">
              <legend className="text-muted-foreground text-xs font-medium uppercase">
                {moduleTitle(module)}
              </legend>
              {items.map(({ key, label }) => {
                const id = `perm-${key}`;
                const allowed = held.has(key);
                return (
                  <div key={key} className="flex items-center gap-2">
                    <Checkbox
                      id={id}
                      disabled={!allowed}
                      checked={permissions.includes(key)}
                      onCheckedChange={(v) =>
                        setPermissions((cur) =>
                          v === true ? [...cur, key] : cur.filter((x) => x !== key),
                        )
                      }
                    />
                    <Label htmlFor={id} className="font-normal">
                      {label}
                      <span className="text-muted-foreground ml-1.5 font-mono text-xs">{key}</span>
                    </Label>
                  </div>
                );
              })}
            </fieldset>
          ))}
        </div>

        <DialogFooter className="sm:justify-between">
          {role ? (
            <Button
              variant="destructive"
              disabled={busy || role.memberCount > 0}
              title={role.memberCount > 0 ? "Remove it from everyone first" : undefined}
              onClick={() => remove.mutate({ roleId: role.id }, { onSuccess: onClose })}
            >
              Delete role
            </Button>
          ) : (
            <span />
          )}
          <div className="flex gap-2">
            <Button variant="ghost" onClick={onClose}>
              Cancel
            </Button>
            <Button disabled={busy || !body.name} onClick={save}>
              Save
            </Button>
          </div>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};
