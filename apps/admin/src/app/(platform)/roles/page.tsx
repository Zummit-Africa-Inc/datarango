"use client";

import { Check, KeyRound, Lock, ShieldAlert } from "lucide-react";
import Link from "next/link";
import { useState } from "react";

import { useStaffPermission } from "@datarango/auth";
import {
  Badge,
  Button,
  PageLayout,
  Sheet,
  SheetContent,
  SheetDescription,
  SheetFooter,
  SheetHeader,
  SheetTitle,
  Skeleton,
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@datarango/ui";

import { Notice } from "@/components/people-ui";
import { byModule } from "@/components/role-form";
import {
  moduleTitle,
  useDeleteRole,
  usePermissionCatalog,
  usePermissionLabel,
  useStaffRoles,
  type StaffPermissionConflict,
  type StaffRole,
} from "@/hooks/people";

/** Custom staff roles, each a set of permissions from the catalog. */
export default function RolesPage() {
  const canView = useStaffPermission("staff:roles:view");
  const canManage = useStaffPermission("staff:roles:manage");

  return (
    <PageLayout
      title="Roles & Permissions"
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
  const { data: catalog } = usePermissionCatalog();
  const [viewing, setViewing] = useState<string | null>(null);

  const modulesOf = (role: StaffRole) => {
    const modules = new Set(
      (catalog?.permissions ?? [])
        .filter((p) => role.permissions.includes(p.key))
        .map((p) => p.module),
    );
    return [...modules].map(moduleTitle).join(", ");
  };

  // Looked up by id so the panel shows the saved version after an edit.
  const viewed = data?.find((r) => r.id === viewing) ?? null;

  return (
    <div className="space-y-6">
      {canManage && (
        <div className="flex justify-end">
          <Button asChild size="sm">
            <Link href="/roles/new">New role</Link>
          </Button>
        </div>
      )}

      {isLoading ? (
        <Skeleton skeleton="table" rows={3} columns={5} />
      ) : !data?.length ? (
        <Notice
          icon={<KeyRound className="text-muted-foreground mx-auto size-8" strokeWidth={1.5} />}
          title="No roles"
          body="Create a role to give staff a set of permissions."
        />
      ) : (
        <div className="border-hairline bg-card overflow-x-auto rounded-xs border">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead className="min-w-56">Role</TableHead>
                <TableHead>Permissions</TableHead>
                <TableHead className="min-w-48">Areas</TableHead>
                <TableHead>People</TableHead>
                <TableHead>Type</TableHead>
                <TableHead>
                  <span className="sr-only">Actions</span>
                </TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {data.map((role) => (
                <TableRow
                  key={role.id}
                  className="cursor-pointer"
                  onClick={() => setViewing(role.id)}
                >
                  <TableCell>
                    <p className="text-ink flex items-center gap-1.5 font-medium">
                      {role.isSystem && <Lock className="text-muted-foreground size-3.5" />}
                      {role.name}
                    </p>
                    {role.description && (
                      <p className="text-muted-foreground mt-0.5 line-clamp-1 max-w-md text-xs">
                        {role.description}
                      </p>
                    )}
                  </TableCell>
                  <TableCell className="mono-data whitespace-nowrap">
                    {role.isSystem ? "All" : role.permissions.length}
                  </TableCell>
                  <TableCell className="text-muted-foreground text-xs">
                    {role.isSystem ? "Everything" : modulesOf(role) || "None"}
                  </TableCell>
                  <TableCell className="mono-data">{role.memberCount}</TableCell>
                  <TableCell>
                    <div className="flex flex-wrap gap-1">
                      {role.isSystem ? (
                        <Badge tone="primary">Built in</Badge>
                      ) : (
                        <Badge appearance="outline" tone="neutral">
                          Custom
                        </Badge>
                      )}
                      {role.conflicts.length > 0 && <Badge tone="danger">Conflict</Badge>}
                    </div>
                  </TableCell>
                  <TableCell className="text-right">
                    <Button
                      size="sm"
                      variant="ghost"
                      onClick={(e) => {
                        e.stopPropagation();
                        setViewing(role.id);
                      }}
                    >
                      View
                    </Button>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </div>
      )}

      {catalog && catalog.conflicts.length > 0 && <DutyRules conflicts={catalog.conflicts} />}

      {viewed && <RoleSheet role={viewed} canManage={canManage} onClose={() => setViewing(null)} />}
    </div>
  );
};

/** The segregation-of-duties pairs, so nobody has to find them by trial and error. */
const DutyRules = ({ conflicts }: { conflicts: StaffPermissionConflict[] }) => {
  const label = usePermissionLabel();
  return (
    <section className="border-hairline bg-card rounded-xs border p-4">
      <h2 className="text-ink flex items-center gap-2 text-sm font-medium">
        <ShieldAlert className="text-muted-foreground size-4" /> Segregation of duties
      </h2>
      <p className="text-muted-foreground mt-1 text-sm">
        Nobody except a Super admin can hold both permissions in a pair, whether in one role or
        across several.
      </p>
      <ul className="mt-3 space-y-3">
        {conflicts.map((c) => (
          <li key={c.id} className="text-sm">
            <p className="text-ink">
              {label(c.first)} <span className="text-muted-foreground">and</span> {label(c.second)}
            </p>
            <p className="text-muted-foreground text-xs">{c.reason}</p>
          </li>
        ))}
      </ul>
    </section>
  );
};

/** Everything a role allows, grouped by area. */
const RoleSheet = ({
  role,
  canManage,
  onClose,
}: {
  role: StaffRole;
  canManage: boolean;
  onClose: () => void;
}) => {
  const { data: catalog } = usePermissionCatalog();
  const remove = useDeleteRole();
  const held = new Set(role.permissions);
  const groups = byModule((catalog?.permissions ?? []).filter((p) => held.has(p.key)));
  const broken = (catalog?.conflicts ?? []).filter((c) => role.conflicts.includes(c.id));

  return (
    <Sheet open onOpenChange={(open) => !open && onClose()}>
      <SheetContent className="w-full overflow-y-auto sm:max-w-md">
        <SheetHeader>
          <SheetTitle className="flex items-center gap-1.5">
            {role.isSystem && <Lock className="text-muted-foreground size-4" />}
            {role.name}
          </SheetTitle>
          <SheetDescription>
            {role.description || "No description."}{" "}
            {role.memberCount === 1 ? "1 person holds it." : `${role.memberCount} people hold it.`}
          </SheetDescription>
        </SheetHeader>

        <div className="space-y-5 px-4">
          {role.isSystem && (
            <p className="text-muted-foreground text-sm">
              Built in and can&apos;t be changed. It is the only role that may hold every
              permission, including the pairs kept apart for everyone else.
            </p>
          )}

          {broken.length > 0 && (
            <div className="border-danger/40 rounded-xs border p-3 text-sm" role="alert">
              <p className="text-danger font-medium">This role breaks segregation of duties</p>
              <p className="text-muted-foreground mt-1 text-xs">
                It was saved before these rules existed. It can&apos;t be saved again until one side
                of each pair is removed.
              </p>
              <ul className="mt-2 space-y-1 text-xs">
                {broken.map((c) => (
                  <li key={c.id}>{c.reason}</li>
                ))}
              </ul>
            </div>
          )}

          {groups.length === 0 ? (
            <p className="text-muted-foreground text-sm">No permissions.</p>
          ) : (
            groups.map(([module, items]) => (
              <section key={module}>
                <h3 className="text-muted-foreground text-xs font-medium uppercase">
                  {moduleTitle(module)}
                </h3>
                <ul className="mt-2 space-y-2">
                  {items.map((p) => (
                    <li key={p.key} className="flex items-start gap-2 text-sm">
                      <Check className="text-success mt-0.5 size-4 shrink-0" />
                      <span>
                        <span className="text-ink block">{p.label}</span>
                        <span className="text-muted-foreground block font-mono text-xs">
                          {p.key}
                        </span>
                      </span>
                    </li>
                  ))}
                </ul>
              </section>
            ))
          )}
        </div>

        {canManage && !role.isSystem && (
          <SheetFooter className="flex-row justify-between">
            <Button
              variant="destructive"
              disabled={remove.isPending || role.memberCount > 0}
              title={role.memberCount > 0 ? "Remove it from everyone first" : undefined}
              onClick={() => remove.mutate({ roleId: role.id }, { onSuccess: onClose })}
            >
              Delete role
            </Button>
            <Button asChild>
              <Link href={`/roles/${role.id}`}>Edit role</Link>
            </Button>
          </SheetFooter>
        )}
      </SheetContent>
    </Sheet>
  );
};
