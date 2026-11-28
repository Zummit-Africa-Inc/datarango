"use client";

import { ArrowLeft } from "lucide-react";
import Link from "next/link";
import { useParams, useRouter } from "next/navigation";
import { useState } from "react";

import { useStaffPermission } from "@datarango/auth";
import { Button, PageLayout, Skeleton } from "@datarango/ui";

import { FormActions } from "@/components/form";
import { OrgProfileFields } from "@/components/org-form";
import { Notice } from "@/components/people-ui";
import { usePlatformOrg, useUpdateOrg, type PlatformOrg } from "@/hooks/operations";

/** Edits an organisation's details and whether its members see Datarango's courses. */
export default function EditOrganizationPage() {
  const { orgId } = useParams<{ orgId: string }>();
  const canEdit = useStaffPermission("orgs:organizations:create");
  const { data, isLoading } = usePlatformOrg(orgId, canEdit);

  return (
    <PageLayout
      title={data ? `Edit ${data.org.name}` : "Edit organisation"}
      subtitle="Details, invoicing contacts and course access."
    >
      <Link
        href={`/organizations/${orgId}`}
        className="text-muted-foreground hover:text-ink mb-4 inline-flex items-center gap-1 text-sm"
      >
        <ArrowLeft className="size-4" /> Back to the organisation
      </Link>
      {!canEdit ? (
        <Notice
          title="You can't edit organisations"
          body="This needs the orgs:organizations:create permission."
        />
      ) : isLoading ? (
        <Skeleton skeleton="page" />
      ) : !data ? (
        <Notice title="Organisation not found" body="No organisation has that id." />
      ) : (
        <EditForm key={data.org.id} org={data.org} />
      )}
    </PageLayout>
  );
}

const EditForm = ({ org }: { org: PlatformOrg }) => {
  const router = useRouter();
  const update = useUpdateOrg();
  const [profile, setProfile] = useState(org.profile);
  const [allowPlatformCourses, setAllowPlatformCourses] = useState(org.allowPlatformCourses);

  return (
    <form
      className="space-y-6"
      onSubmit={(e) => {
        e.preventDefault();
        update.mutate(
          { orgId: org.id, profile, allowPlatformCourses },
          { onSuccess: () => router.push(`/organizations/${org.id}`) },
        );
      }}
    >
      <OrgProfileFields
        profile={profile}
        onChange={setProfile}
        allowPlatformCourses={allowPlatformCourses}
        onAllowPlatformCourses={setAllowPlatformCourses}
      />
      <FormActions>
        <Button asChild variant="ghost">
          <Link href={`/organizations/${org.id}`}>Cancel</Link>
        </Button>
        <Button type="submit" disabled={update.isPending}>
          {update.isPending ? "Saving…" : "Save changes"}
        </Button>
      </FormActions>
    </form>
  );
};
