"use client";

import { ArrowLeft } from "lucide-react";
import Link from "next/link";

import { useStaffPermission } from "@datarango/auth";
import { PageLayout } from "@datarango/ui";

import { Notice } from "@/components/people-ui";
import { RoleForm } from "@/components/role-form";

export default function NewRolePage() {
  const canManage = useStaffPermission("staff:roles:manage");
  return (
    <PageLayout title="New role" subtitle="A named set of permissions to give staff.">
      <Link
        href="/roles"
        className="text-muted-foreground hover:text-ink mb-4 inline-flex items-center gap-1 text-sm"
      >
        <ArrowLeft className="size-4" /> Roles & Permissions
      </Link>
      {canManage ? (
        <RoleForm role={null} />
      ) : (
        <Notice
          title="You can't create roles"
          body="This needs the staff:roles:manage permission."
        />
      )}
    </PageLayout>
  );
}
