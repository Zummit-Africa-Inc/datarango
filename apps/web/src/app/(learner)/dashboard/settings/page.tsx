"use client";

import { useState } from "react";

import { PageLayout, TabList, TabPanel } from "@datarango/ui";

import { EmailStatus } from "@/components/settings/email-status";
import { MfaSection } from "@/components/settings/mfa-section";

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
            <p>Billing settings content</p>
          </TabPanel>
          <TabPanel selected={activeTab} value="notifications">
            <p>Notification settings content</p>
          </TabPanel>
        </div>
      </div>
    </PageLayout>
  );
}
