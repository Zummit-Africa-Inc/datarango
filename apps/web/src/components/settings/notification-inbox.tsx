"use client";

import { Bell, CheckCheck } from "lucide-react";

import { Badge, Button, Skeleton } from "@datarango/ui";

import { useInbox, useMarkAllRead, useMarkRead, type InboxEntry } from "@/hooks/notifications";

/**
 * The in-app inbox.
 *
 * Every notification the platform has written has been unreadable in the web app
 * until now — the endpoints existed and nothing called them. This is the first
 * surface that does.
 *
 * Copy is derived from the template with a **fallback that still says something
 * useful**: templates are added server-side by whoever adds a notification, so a
 * client that only knows a fixed list would render blank rows for anything new.
 * An unknown template shows its own name rather than nothing.
 */
export const NotificationInbox = () => {
  const { data, isLoading } = useInbox();
  const markRead = useMarkRead();
  const markAllRead = useMarkAllRead();

  if (isLoading) return <Skeleton skeleton="table" rows={4} columns={2} />;

  const items = data?.items ?? [];
  const unread = data?.unreadCount ?? 0;

  return (
    <div className="space-y-3">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div className="flex items-center gap-2">
          <h3 className="text-ink text-sm font-medium">Your notifications</h3>
          {unread > 0 && <Badge variant="success">{unread} unread</Badge>}
        </div>
        {unread > 0 && (
          <Button
            size="sm"
            variant="outline"
            disabled={markAllRead.isPending}
            onClick={() => markAllRead.mutate()}
          >
            <CheckCheck className="size-3.5" />
            Mark all read
          </Button>
        )}
      </div>

      {items.length === 0 ? (
        <div className="border-hairline bg-card rounded-xs border px-6 py-12 text-center">
          <Bell className="text-muted-foreground mx-auto size-8" strokeWidth={1.5} />
          <p className="font-heading text-ink mt-3 text-lg">Nothing here yet</p>
          <p className="text-muted-foreground mt-1 text-sm">
            You&apos;ll hear about course approvals, certificates and competition results here.
          </p>
        </div>
      ) : (
        <ul className="border-hairline bg-card rounded-xs border">
          {items.map((entry) => (
            <li
              className="border-hairline flex items-start gap-3 border-b px-4 py-3 text-sm last:border-b-0"
              key={entry.id}
            >
              <span
                className={
                  entry.readAt
                    ? "bg-muted mt-1.5 size-2 shrink-0 rounded-full"
                    : "bg-primary-500 mt-1.5 size-2 shrink-0 rounded-full"
                }
                aria-label={entry.readAt ? "Read" : "Unread"}
              />
              <div className="min-w-0 flex-1">
                <p className="text-ink">{describe(entry)}</p>
                <p className="text-muted-foreground mt-0.5 text-xs">
                  {new Date(entry.createdAt).toLocaleString()} · {entry.category}
                </p>
              </div>
              {!entry.readAt && (
                <Button
                  size="sm"
                  variant="ghost"
                  disabled={markRead.isPending}
                  onClick={() => markRead.mutate({ ids: [entry.id] })}
                >
                  Mark read
                </Button>
              )}
            </li>
          ))}
        </ul>
      )}

      {data?.nextCursor && (
        // Deliberately not a pager yet: the cursor is opaque and this surface
        // shows the most recent page, which is what an inbox is for. Saying more
        // exists beats silently truncating.
        <p className="text-muted-foreground text-xs">
          Showing your most recent {items.length}. Older notifications aren&apos;t listed here.
        </p>
      )}
    </div>
  );
};

/**
 * Best-effort copy per template, degrading to the template name rather than to
 * nothing.
 *
 * **The names here are the server's, and were wrong until 2026-08-28.** Every
 * consumer in platform.notification writes kebab-case (`course-published`,
 * `certificate`, `media-failed`); this switch matched on dotted names
 * (`course.published`) that nothing has ever produced, so every case was dead
 * and every notification fell through to the default — the inbox has been
 * rendering the raw template string as its own message this whole time. The
 * fallback is what kept it from looking broken, which is also why nobody
 * noticed.
 *
 * Payload field names come from the consumer that writes them, so they are
 * read defensively and each case names the one it needs.
 */
const describe = (entry: InboxEntry): string => {
  const payload = entry.payload ?? {};
  const text = (key: string) =>
    typeof payload[key] === "string" ? (payload[key] as string) : null;
  const num = (key: string) =>
    typeof payload[key] === "number" ? (payload[key] as number) : null;

  switch (entry.template) {
    // `title` — see ReviewNotificationConsumer.
    case "course-published":
      return `Your course ${text("title") ?? ""} is published.`.replace(/\s{2,}/g, " ");
    case "course-rejected":
      return `Your course ${text("title") ?? ""} needs changes${
        text("reason") ? `: ${text("reason")}` : "."
      }`.replace(/\s{2,}/g, " ");
    case "course-completed":
      return "You finished a course — nice work.";
    case "course-assigned":
      return "A course was assigned to you.";
    case "certificate":
      return `Certificate issued for ${text("courseTitle") ?? "a completed course"}.`;
    case "media-failed":
      return `An upload could not be processed${text("error") ? `: ${text("error")}` : "."}`;

    // Phase 5 — the two celebrations. Everything they render rides on the
    // event, so neither needs a lookup.
    case "level-up": {
      const to = num("toLevel");
      return to === null ? "You levelled up." : `You reached level ${to}.`;
    }
    case "badge-earned":
      return `Badge earned: ${text("name") ?? "a new badge"}${
        text("description") ? ` — ${text("description")}` : "."
      }`;

    default:
      return text("message") ?? text("title") ?? entry.template;
  }
};
