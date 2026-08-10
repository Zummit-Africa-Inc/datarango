"use client";

import Link from "next/link";
import { useState } from "react";
import { Bell } from "lucide-react";
import { formatDistanceToNow } from "date-fns";

import { Button, Popover, PopoverContent, PopoverTrigger, ScrollArea, cn } from "@datarango/ui";

import { notificationCopy } from "./notification-copy";
import type { InboxEntry } from "./types";
import {
  useInbox,
  useMarkAllNotificationsRead,
  useMarkNotificationsRead,
  useUnreadCount,
} from "./use-inbox";

/**
 * The notification bell and its inbox panel — shared across the app shells, so
 * three headers do not grow three subtly different inboxes.
 *
 * The panel's list is only fetched while it is open. The badge is always live,
 * which is the split the two endpoints exist for.
 */
export const NotificationBell = () => {
  const [open, setOpen] = useState(false);

  const { data: unread } = useUnreadCount();
  const inbox = useInbox({ enabled: open });
  const markRead = useMarkNotificationsRead();
  const markAllRead = useMarkAllNotificationsRead();

  const count = unread?.unreadCount ?? 0;
  const entries = inbox.items;
  const hasUnread = count > 0;

  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger asChild>
        <button
          type="button"
          className="hover:bg-muted relative grid size-9 place-items-center rounded-md"
          // The count belongs in the label, not just the badge — a screen reader
          // otherwise announces "Notifications" whether there are none or nine.
          aria-label={
            hasUnread ? `Notifications, ${count} unread` : "Notifications, none unread"
          }
        >
          <Bell className="size-4" />
          {hasUnread && (
            <span
              aria-hidden
              className="bg-primary text-primary-foreground absolute -top-0.5 -right-0.5 grid min-w-4 place-items-center rounded-full px-1 text-[10px] leading-4 font-medium"
            >
              {count > 9 ? "9+" : count}
            </span>
          )}
        </button>
      </PopoverTrigger>

      <PopoverContent align="end" className="w-90 p-0">
        <div className="flex items-center justify-between border-b px-4 py-3">
          <p className="font-heading text-sm">Notifications</p>
          {hasUnread && (
            <Button
              size="sm"
              variant="ghost"
              disabled={markAllRead.isPending}
              onClick={() => markAllRead.mutate()}
            >
              Mark all read
            </Button>
          )}
        </div>

        <ScrollArea className="max-h-96">
          {inbox.isPending && open ? (
            <p className="text-muted-foreground px-4 py-8 text-center text-sm">Loading…</p>
          ) : entries.length === 0 ? (
            <p className="text-muted-foreground px-4 py-8 text-center text-sm">
              Nothing yet. Course completions, assignments and certificates land here.
            </p>
          ) : (
            <ul className="divide-y">
              {entries.map((entry) => (
                <NotificationRow
                  key={entry.id}
                  entry={entry}
                  onOpen={() => {
                    setOpen(false);
                    if (!entry.readAt) markRead.mutate({ ids: [entry.id] });
                  }}
                />
              ))}
            </ul>
          )}

          {inbox.hasNextPage && (
            <div className="p-2">
              <Button
                className="w-full"
                size="sm"
                variant="ghost"
                disabled={inbox.isFetchingNextPage}
                onClick={() => inbox.fetchNextPage()}
              >
                {inbox.isFetchingNextPage ? "Loading…" : "Older notifications"}
              </Button>
            </div>
          )}
        </ScrollArea>
      </PopoverContent>
    </Popover>
  );
};

const NotificationRow = ({ entry, onOpen }: { entry: InboxEntry; onOpen: () => void }) => {
  const copy = notificationCopy(entry);

  const body = (
    <div className="flex gap-x-3 px-4 py-3 text-left">
      <span
        aria-hidden
        className={cn(
          "mt-1.5 size-2 shrink-0 rounded-full",
          entry.readAt ? "bg-transparent" : "bg-primary",
        )}
      />
      <div className="min-w-0">
        <p className={cn("text-sm", !entry.readAt && "font-medium")}>{copy.title}</p>
        {copy.body && <p className="text-muted-foreground mt-0.5 text-xs">{copy.body}</p>}
        <p className="text-muted-foreground mt-1 text-[11px]">
          {formatDistanceToNow(new Date(entry.createdAt), { addSuffix: true })}
        </p>
      </div>
    </div>
  );

  return (
    <li className={cn("hover:bg-muted/50", !entry.readAt && "bg-muted/20")}>
      {copy.href ? (
        <Link href={copy.href} onClick={onOpen} className="block">
          {body}
        </Link>
      ) : (
        // An entry with no destination — an unrecognised template — is still
        // clickable, because being able to clear it is the whole reason a
        // learner opens this panel.
        <button type="button" onClick={onOpen} className="block w-full">
          {body}
        </button>
      )}
    </li>
  );
};
