"use client";

import { Checkbox, Label, Skeleton } from "@datarango/ui";

import {
  conflictsIn,
  usePermissionCatalog,
  usePermissionLabel,
  useStaffRoles,
} from "@/hooks/people";

/**
 * Role checkboxes. Accounts refuses roles carrying permissions the inviter
 * doesn't hold, and any set of roles that together hold both sides of a
 * segregation-of-duties pair, so a role that would complete a pair with the
 * ones already ticked is greyed out with the reason. Super admin is exempt:
 * with it ticked, nothing else is limited.
 */
export const RolePicker = ({
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
