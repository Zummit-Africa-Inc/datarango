"use client";

import { useState } from "react";

import { PageLayout, TabList, TabPanel } from "@datarango/ui";

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
          <TabPanel selected={activeTab} value="account">
            <p>Account settings content</p>
          </TabPanel>
          <TabPanel selected={activeTab} value="security">
            <p>Security settings content</p>
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
