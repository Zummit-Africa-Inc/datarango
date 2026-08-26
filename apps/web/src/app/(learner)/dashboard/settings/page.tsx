"use client";

import { useState } from "react";

import { PageLayout, TabList, TabPanel } from "@datarango/ui";

import { EmailStatus } from "@/components/settings/email-status";
import { MfaSection } from "@/components/settings/mfa-section";
import { NotificationInbox } from "@/components/settings/notification-inbox";

const TABS = [
  { label: "Account", value: "account" },
  { label: "Security", value: "security" },
  { label: "Billing", value: "billing" },
  { label: "Notifications", value: "notifications" },
];

export default function SettingsPage() {
  const [activeTab, setActiveTab] = useState("account");

  return (
    <PageLayout title="Settings" subtitle="Manage your account and security.">
      <div className="space-y-6">
        <TabList activeTab={activeTab} onTabChange={setActiveTab} tabs={TABS} />
        <div>
          {/*
            Both of these components existed and were imported by nothing, so
            the screens they implement were unreachable in the product while the
            build stayed green — MFA enrolment in particular. ESLint's
            unused-export finding is what surfaced it.
          */}
          <TabPanel selected={activeTab} value="account">
            <EmailStatus />
          </TabPanel>
          <TabPanel selected={activeTab} value="security">
            <MfaSection />
          </TabPanel>
          <TabPanel selected={activeTab} value="billing">
            {/* No billing backend exists — economy's billing module has no
                subjects and no routes — so this says so plainly rather than
                rendering controls that would fail, or a fake plan. */}
            <div className="border-hairline bg-muted/40 rounded-xs border px-4 py-3 text-sm">
              <p className="text-ink font-medium">Billing isn&apos;t live yet</p>
              <p className="text-muted-foreground mt-1">
                Everything on the platform is free while billing is being built. There is no plan,
                no card on file and nothing to cancel.
              </p>
            </div>
          </TabPanel>
          <TabPanel selected={activeTab} value="notifications">
            {/* The inbox, not preferences: what platform.notification actually
                offers is a read surface, and it had no consumer at all. Delivery
                preferences need a backend that doesn't exist yet. */}
            <NotificationInbox />
          </TabPanel>
        </div>
      </div>
    </PageLayout>
  );
}
