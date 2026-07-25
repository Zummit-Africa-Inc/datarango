"use client";

import { useState } from "react";

import { getApi } from "@datarango/api";
import { useUser } from "@datarango/auth";
import { Button, PageLayout } from "@datarango/ui";

import { MfaSection } from "@/components/settings/mfa-section";

const EmailStatus = () => {
  const user = useUser();
  const [sent, setSent] = useState(false);
  const [busy, setBusy] = useState(false);

  if (!user) return null;

  const resend = async () => {
    setBusy(true);
    await getApi()
      .post("/auth/verify-email/resend")
      .catch(() => undefined);
    setSent(true);
    setBusy(false);
  };

  return (
    <section className="border-hairline bg-card rounded-xs border p-6">
      <div className="flex items-center justify-between gap-4">
        <div className="space-y-1">
          <h2 className="font-heading text-ink text-lg">Email address</h2>
          <p className="text-muted-foreground text-sm">{user.email}</p>
        </div>
        {user.emailVerified ? (
          <span className="text-sm text-emerald-600">Verified</span>
        ) : sent ? (
          <span className="text-muted-foreground text-sm">Verification sent</span>
        ) : (
          <Button variant="outline" size="sm" onClick={resend} disabled={busy}>
            {busy ? "…" : "Resend verification"}
          </Button>
        )}
      </div>
    </section>
  );
};

export default function SettingsPage() {
  return (
    <PageLayout title="Settings" subtitle="Manage your account and security.">
      <EmailStatus />
      <MfaSection />
    </PageLayout>
  );
}
