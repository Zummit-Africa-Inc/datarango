"use client";

import { ArrowLeft, Copy } from "lucide-react";
import Link from "next/link";
import { useState } from "react";

import { useStaffPermission } from "@datarango/auth";
import { Button, Input, PageLayout } from "@datarango/ui";

import { Field, FormSection } from "@/components/form";
import { Notice } from "@/components/people-ui";
import { RolePicker } from "@/components/role-picker";
import { useInviteStaff, type StaffInvite } from "@/hooks/people";

/**
 * Invite someone to the admin app. They sign in with their Trustaige account
 * for this email; there is no password to set, and the first sign-in ties the
 * staff account to that Trustaige identity.
 */
export default function InviteStaffPage() {
  const canManage = useStaffPermission("staff:accounts:manage");
  const invite = useInviteStaff();
  const [email, setEmail] = useState("");
  const [name, setName] = useState("");
  const [roleIds, setRoleIds] = useState<string[]>([]);
  const [sent, setSent] = useState<StaffInvite | null>(null);

  const valid = /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email.trim()) && name.trim().length > 0;

  return (
    <PageLayout title="Invite staff" subtitle="Give someone an account in Datarango Admin.">
      <Link
        href="/staff"
        className="text-muted-foreground hover:text-ink mb-4 inline-flex items-center gap-1 text-sm"
      >
        <ArrowLeft className="size-4" /> Staff
      </Link>
      {!canManage ? (
        <Notice
          title="You can't invite staff"
          body="This needs the staff:accounts:manage permission."
        />
      ) : sent ? (
        <section className="border-hairline bg-card space-y-4 rounded-xs border p-5">
          <h2 className="text-ink font-medium">Invite sent to {sent.account.email}</h2>
          <p className="text-muted-foreground text-sm">
            If the email doesn&apos;t arrive, send them this link yourself. It is just the admin
            sign-in page: only the Trustaige account for {sent.account.email} gets in.
          </p>
          <p className="border-border bg-background-subtle rounded-lg border p-3 font-mono text-xs break-all select-all">
            {sent.inviteLink}
          </p>
          <div className="flex justify-end gap-2">
            <Button
              variant="secondary"
              onClick={() => navigator.clipboard?.writeText(sent.inviteLink)}
            >
              <Copy className="size-4" /> Copy link
            </Button>
            <Button asChild>
              <Link href="/staff">Done</Link>
            </Button>
          </div>
        </section>
      ) : (
        <form
          className="space-y-6"
          onSubmit={(e) => {
            e.preventDefault();
            invite.mutate(
              { email: email.trim(), displayName: name.trim(), roleIds },
              { onSuccess: setSent },
            );
          }}
        >
          <FormSection
            title="Who"
            description="They get an email with the admin sign-in link and sign in with their Trustaige account for this email. There is no password to set."
          >
            <Field label="Name" htmlFor="invite-name">
              <Input id="invite-name" value={name} onChange={(e) => setName(e.target.value)} />
            </Field>
            <Field label="Work email" htmlFor="invite-email">
              <Input
                id="invite-email"
                type="email"
                autoComplete="off"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
              />
            </Field>
          </FormSection>
          <FormSection
            title="Roles"
            description="What they can do. Change it any time from Staff."
            cols={1}
          >
            <RolePicker selected={roleIds} onChange={setRoleIds} />
          </FormSection>
          <div className="flex justify-end gap-2">
            <Button asChild variant="ghost">
              <Link href="/staff">Cancel</Link>
            </Button>
            <Button type="submit" disabled={!valid || invite.isPending}>
              {invite.isPending ? "Sending…" : "Send invite"}
            </Button>
          </div>
        </form>
      )}
    </PageLayout>
  );
}
