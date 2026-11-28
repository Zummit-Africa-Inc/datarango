"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useMemo, useState } from "react";

import { useUser } from "@datarango/auth";
import { Button, Checkbox, Input, Label, Textarea } from "@datarango/ui";

import {
  blockedBy,
  conflictsIn,
  moduleTitle,
  useCreateRole,
  useDeleteRole,
  usePermissionCatalog,
  usePermissionLabel,
  useUpdateRole,
  type StaffPermissionInfo,
  type StaffRole,
} from "@/hooks/people";

/** Catalog entries grouped by module, in catalog order. */
export const byModule = (permissions: StaffPermissionInfo[]) => {
  const out = new Map<string, StaffPermissionInfo[]>();
  for (const p of permissions) out.set(p.module, [...(out.get(p.module) ?? []), p]);
  return [...out.entries()];
};

/**
 * Create or edit a role, as a page. Only permissions the editor holds can be
 * ticked (accounts refuses anything else), and ticking one side of a
 * segregation-of-duties pair greys out the other, with the reason.
 */
export const RoleForm = ({ role }: { role: StaffRole | null }) => {
  const router = useRouter();
  const me = useUser();
  const { data: catalog } = usePermissionCatalog();
  const label = usePermissionLabel();
  const create = useCreateRole();
  const update = useUpdateRole();
  const remove = useDeleteRole();

  const [name, setName] = useState(role?.name ?? "");
  const [description, setDescription] = useState(role?.description ?? "");
  const [permissions, setPermissions] = useState<string[]>(role?.permissions ?? []);

  const held = useMemo(() => new Set<string>(me?.staffPermissions ?? []), [me]);
  const groups = useMemo(() => byModule(catalog?.permissions ?? []), [catalog]);
  const rules = catalog?.conflicts ?? [];
  const blocked = blockedBy(rules, permissions);
  // Only possible for a role saved before the rules: both sides ticked.
  const broken = conflictsIn(rules, permissions);

  const busy = create.isPending || update.isPending || remove.isPending;
  const body = { name: name.trim(), description: description.trim(), permissions };
  const done = () => router.push("/roles");

  const save = () =>
    role
      ? update.mutate({ roleId: role.id, ...body }, { onSuccess: done })
      : create.mutate(body, { onSuccess: done });

  return (
    <form
      className="max-w-3xl space-y-6"
      onSubmit={(e) => {
        e.preventDefault();
        save();
      }}
    >
      <section className="border-hairline bg-card space-y-4 rounded-xs border p-5">
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
      </section>

      <section className="border-hairline bg-card space-y-5 rounded-xs border p-5">
        <div>
          <h2 className="text-ink text-sm font-medium">Permissions</h2>
          <p className="text-muted-foreground text-sm">
            You can only include permissions you hold. Permissions that mustn&apos;t be held
            together are greyed out once you pick the other one.
          </p>
        </div>

        {broken.length > 0 && (
          <p className="text-danger text-sm" role="alert">
            Untick one side of each pair to save:{" "}
            {broken.map((c) => `${label(c.first)} / ${label(c.second)}`).join("; ")}.
          </p>
        )}

        <div className="grid gap-6 md:grid-cols-2">
          {groups.map(([module, items]) => (
            <fieldset key={module} className="space-y-2">
              <legend className="text-muted-foreground mb-1 text-xs font-medium uppercase">
                {moduleTitle(module)}
              </legend>
              {items.map(({ key, label: text }) => {
                const id = `perm-${key}`;
                const rule = blocked.get(key);
                const checked = permissions.includes(key);
                return (
                  <div key={key} className="flex items-start gap-2">
                    <Checkbox
                      id={id}
                      className="mt-0.5"
                      disabled={!held.has(key) || (!!rule && !checked)}
                      checked={checked}
                      onCheckedChange={(v) =>
                        setPermissions((cur) =>
                          v === true ? [...cur, key] : cur.filter((x) => x !== key),
                        )
                      }
                    />
                    <Label htmlFor={id} className="block leading-tight font-normal">
                      <span className="block">{text}</span>
                      <span className="text-muted-foreground block font-mono text-xs">{key}</span>
                      {rule && !checked && (
                        <span className="text-warning mt-1 block text-xs">
                          Not with {label(rule.first === key ? rule.second : rule.first)}:{" "}
                          {rule.reason}
                        </span>
                      )}
                    </Label>
                  </div>
                );
              })}
            </fieldset>
          ))}
        </div>
      </section>

      <div className="flex flex-wrap justify-between gap-2">
        {role ? (
          <Button
            type="button"
            variant="destructive"
            disabled={busy || role.memberCount > 0}
            title={role.memberCount > 0 ? "Remove it from everyone first" : undefined}
            onClick={() => remove.mutate({ roleId: role.id }, { onSuccess: done })}
          >
            Delete role
          </Button>
        ) : (
          <span />
        )}
        <div className="flex gap-2">
          <Button asChild variant="ghost">
            <Link href="/roles">Cancel</Link>
          </Button>
          <Button
            type="submit"
            disabled={busy || !body.name || !permissions.length || broken.length > 0}
          >
            {role ? "Save role" : "Create role"}
          </Button>
        </div>
      </div>
    </form>
  );
};
