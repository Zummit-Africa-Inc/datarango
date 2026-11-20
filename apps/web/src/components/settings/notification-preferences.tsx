"use client";

import { Skeleton, Switch } from "@datarango/ui";

import {
  type PreferenceChannel,
  useNotificationPreferences,
  useSetNotificationPreferences,
} from "@/hooks/notifications";

/**
 * What can be switched off, limited to what the platform actually sends: a
 * toggle for a category nothing produces would be a control that does
 * nothing. The server accepts more (grading, marketing) for when they exist.
 */
const ROWS: { category: string; label: string; detail: string; channels: PreferenceChannel[] }[] = [
  {
    category: "general",
    label: "Courses and certificates",
    detail: "Assignments, completions, certificates, review decisions and upload problems.",
    channels: ["email", "inApp"],
  },
  {
    category: "gamification",
    label: "Levels and badges",
    detail: "When you level up or earn a badge.",
    channels: ["inApp"],
  },
];

const CHANNEL_LABEL: Record<PreferenceChannel, string> = { email: "Email", inApp: "In-app" };

export const NotificationPreferences = () => {
  const { data, isLoading } = useNotificationPreferences();
  const save = useSetNotificationPreferences();

  if (isLoading) return <Skeleton skeleton="list" rows={2} />;

  const enabled = (category: string, channel: PreferenceChannel) =>
    data?.preferences.find((p) => p.category === category && p.channel === channel)?.enabled ??
    true;

  const toggle = (category: string, channel: PreferenceChannel, value: boolean) =>
    save.mutate({ preferences: [{ category, channel, enabled: value }] });

  return (
    <div className="border-hairline bg-card rounded-xs border">
      <div className="border-hairline border-b px-4 py-3">
        <p className="text-ink font-medium">What we send you</p>
        <p className="text-muted-foreground mt-0.5 text-sm">
          Account security emails (sign-in verification, password resets) are always sent.
        </p>
      </div>
      {ROWS.map((row) => (
        <div
          className="border-hairline flex flex-wrap items-center gap-4 border-b px-4 py-3 last:border-0"
          key={row.category}
        >
          <div className="min-w-0 flex-1">
            <p className="text-ink text-sm">{row.label}</p>
            <p className="text-muted-foreground text-xs">{row.detail}</p>
          </div>
          <div className="flex items-center gap-5">
            {row.channels.map((channel) => (
              <label className="flex items-center gap-2 text-sm" key={channel}>
                <Switch
                  aria-label={`${row.label} by ${CHANNEL_LABEL[channel]}`}
                  checked={enabled(row.category, channel)}
                  disabled={save.isPending}
                  onCheckedChange={(value) => toggle(row.category, channel, value)}
                />
                {CHANNEL_LABEL[channel]}
              </label>
            ))}
          </div>
        </div>
      ))}
    </div>
  );
};
