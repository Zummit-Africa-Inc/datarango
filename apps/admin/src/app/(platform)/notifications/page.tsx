"use client";

import { MailWarning } from "lucide-react";
import { useState } from "react";

import { useStaffPermission } from "@datarango/auth";
import { Button, PageLayout, Skeleton } from "@datarango/ui";

import {
  useDeadLetters,
  useRequeueDeadLetters,
  type DeadLetter,
  type NotificationChannel,
} from "@/hooks/notifications";

const PAGE_SIZE = 50;

const CHANNELS: { value: NotificationChannel | undefined; label: string }[] = [
  { value: undefined, label: "All" },
  { value: "email", label: "Email" },
  { value: "inApp", label: "In-app" },
  { value: "webPush", label: "Push" },
];

/**
 * Notifications that failed for good: retries exhausted, a permanent
 * provider error, or no sender for the channel. They stay here until requeued;
 * nothing is deleted.
 */
export default function DeadLettersPage() {
  const canRead = useStaffPermission("notifications:deliveries:view");
  const canRequeue = useStaffPermission("notifications:deliveries:retry");

  const [channel, setChannel] = useState<NotificationChannel | undefined>();
  const [page, setPage] = useState(1);
  const [selected, setSelected] = useState<Set<string>>(new Set());

  const { data, isLoading } = useDeadLetters({ channel, page, pageSize: PAGE_SIZE });
  const requeue = useRequeueDeadLetters();

  const items = data?.items ?? [];
  const total = data?.total ?? 0;
  const pages = Math.max(1, Math.ceil(total / PAGE_SIZE));

  if (!canRead) {
    return (
      <PageLayout title="Failed notifications" subtitle="The notification dead-letter queue.">
        <div className="border-hairline bg-card rounded-xs border px-6 py-12 text-center">
          <p className="font-heading text-ink text-lg">You can&apos;t see failed notifications</p>
          <p className="text-muted-foreground mx-auto mt-1 max-w-md text-sm">
            Failed notifications show recipients&apos; addresses, so reading them needs the
            notifications.view permission.
          </p>
        </div>
      </PageLayout>
    );
  }

  const toggle = (id: string) =>
    setSelected((current) => {
      const next = new Set(current);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });

  const allOnPage = items.length > 0 && items.every((i) => selected.has(i.id));
  const toggleAll = () => setSelected(allOnPage ? new Set() : new Set(items.map((i) => i.id)));

  const requeueSelected = () =>
    requeue.mutate(
      { ids: [...selected] },
      {
        onSuccess: () => {
          setSelected(new Set());
          setPage(1);
        },
      },
    );

  return (
    <PageLayout
      title="Failed notifications"
      subtitle="Retries exhausted or failed permanently. Nothing here is deleted; requeueing gives a fresh retry budget."
    >
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div className="flex gap-1">
          {CHANNELS.map((c) => (
            <Button
              key={c.label}
              size="sm"
              variant={channel === c.value ? "default" : "ghost"}
              onClick={() => {
                setChannel(c.value);
                setPage(1);
                setSelected(new Set());
              }}
            >
              {c.label}
            </Button>
          ))}
        </div>

        {canRequeue ? (
          <Button
            size="sm"
            disabled={selected.size === 0 || requeue.isPending}
            onClick={requeueSelected}
          >
            Requeue {selected.size > 0 ? selected.size : ""} selected
          </Button>
        ) : (
          <p className="text-muted-foreground text-xs">
            Requeueing needs the notifications.manage permission.
          </p>
        )}
      </div>

      {isLoading ? (
        <Skeleton skeleton="table" rows={5} columns={4} />
      ) : items.length === 0 ? (
        <div className="border-hairline bg-card rounded-xs border px-6 py-16 text-center">
          <MailWarning className="text-muted-foreground mx-auto size-8" strokeWidth={1.5} />
          <p className="font-heading text-ink mt-3 text-lg">No failed notifications</p>
          <p className="text-muted-foreground mx-auto mt-1 max-w-md text-sm">
            Every queued notification was delivered or is still being retried.
          </p>
        </div>
      ) : (
        <div className="border-hairline bg-card overflow-x-auto rounded-xs border">
          <div className="border-hairline text-muted-foreground grid min-w-180 grid-cols-[auto_1.2fr_1fr_2fr_auto] gap-4 border-b px-4 py-2 text-xs font-medium uppercase">
            {canRequeue ? (
              <input
                aria-label="Select all on this page"
                checked={allOnPage}
                onChange={toggleAll}
                type="checkbox"
              />
            ) : (
              <span />
            )}
            <span>Recipient</span>
            <span>Template</span>
            <span>Last error</span>
            <span>Failed</span>
          </div>
          {items.map((item) => (
            <Row
              key={item.id}
              item={item}
              selectable={canRequeue}
              selected={selected.has(item.id)}
              onToggle={() => toggle(item.id)}
            />
          ))}
        </div>
      )}

      {total > PAGE_SIZE && (
        <div className="flex items-center justify-between">
          <p className="text-muted-foreground text-sm">
            Page {page} of {pages} · {total} failed
          </p>
          <div className="flex gap-2">
            <Button
              size="sm"
              variant="outline"
              disabled={page <= 1}
              onClick={() => setPage((p) => p - 1)}
            >
              Previous
            </Button>
            <Button
              size="sm"
              variant="outline"
              disabled={page >= pages}
              onClick={() => setPage((p) => p + 1)}
            >
              Next
            </Button>
          </div>
        </div>
      )}
    </PageLayout>
  );
}

const Row = ({
  item,
  selectable,
  selected,
  onToggle,
}: {
  item: DeadLetter;
  selectable: boolean;
  selected: boolean;
  onToggle: () => void;
}) => (
  <div className="border-hairline grid min-w-180 grid-cols-[auto_1.2fr_1fr_2fr_auto] items-start gap-4 border-b px-4 py-3 text-sm last:border-0">
    {selectable ? (
      <input
        aria-label={`Select notification to ${item.recipient}`}
        checked={selected}
        className="mt-1"
        onChange={onToggle}
        type="checkbox"
      />
    ) : (
      <span />
    )}
    <div className="min-w-0">
      <p className="text-ink truncate">{item.recipient}</p>
      <p className="text-muted-foreground text-xs">
        {item.channel} · {item.category}
      </p>
    </div>
    <div className="min-w-0">
      <p className="mono-data text-ink truncate text-xs">{item.template}</p>
      <p className="text-muted-foreground text-xs">
        {item.attempts} attempt{item.attempts === 1 ? "" : "s"}
      </p>
    </div>
    <p className="text-muted-foreground line-clamp-3 text-xs wrap-break-word">
      {item.lastError ?? "No error recorded."}
    </p>
    <span className="text-muted-foreground text-xs whitespace-nowrap">
      {new Date(item.deadAt).toLocaleString()}
    </span>
  </div>
);
