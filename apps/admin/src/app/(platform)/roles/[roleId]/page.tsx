"use client";

import { ArrowLeft } from "lucide-react";
import Link from "next/link";
import { useParams } from "next/navigation";

import { useStaffPermission } from "@datarango/auth";
import { PageLayout, Skeleton } from "@datarango/ui";

import { Notice } from "@/components/people-ui";
import { RoleForm } from "@/components/role-form";
import { useStaffRoles } from "@/hooks/people";

export default function EditRolePage() {
  const { roleId } = useParams<{ roleId: string }>();
  const canManage = useStaffPermission("staff:roles:manage");
  const { data, isLoading } = useStaffRoles(canManage);
  const role = data?.find((r) => r.id === roleId);

  return (
    <PageLayout
      title={role ? `Edit ${role.name}` : "Edit role"}
      subtitle="Change what this role allows."
    >
      <Link
        href="/roles"
        className="text-muted-foreground hover:text-ink mb-4 inline-flex items-center gap-1 text-sm"
      >
        <ArrowLeft className="size-4" /> Roles & Permissions
      </Link>
      {!canManage ? (
        <Notice title="You can't edit roles" body="This needs the staff:roles:manage permission." />
      ) : isLoading ? (
        <Skeleton skeleton="page" />
      ) : !role ? (
        <Notice title="Role not found" body="It may have been deleted." />
      ) : role.isSystem ? (
        <Notice
          title="Super admin can't be changed"
          body="It is built in and always holds every permission."
        />
      ) : (
        <RoleForm key={role.id} role={role} />
      )}
    </PageLayout>
  );
}
