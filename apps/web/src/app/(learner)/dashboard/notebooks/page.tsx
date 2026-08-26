"use client";

import { useEffect, useMemo, useState } from "react";
import { AlertTriangle, Clock, Loader2, NotebookPen, Square } from "lucide-react";

import { Badge, Button, PageLayout, Skeleton } from "@datarango/ui";

import {
  isLive,
  useCurrentSession,
  useHeartbeat,
  useRequestSession,
  useStopSession,
  type NotebookSession,
} from "@/hooks/notebook";

/**
 * The notebook session console.
 *
 * This page was a literal `<div>Page</div>` while the service behind it had a
 * full session lifecycle, RLS, quotas and a reaper — the same "built and
 * unreachable" shape as platform.media before its UI landed.
 *
 * It is one session rather than a list because the service allows exactly one
 * live session per user: a second kernel is a second sandbox and a second memory
 * reservation. So there is no notebooks list to build, and nothing to put behind
 * a per-notebook route.
 *
 * **Execution is not wired up here, and the page says so.** The sandbox runtime
 * is the outstanding Phase 3 blocker; `SimulatedSandbox` brings a session
 * through its lifecycle without running any code. Rendering a code cell that
 * silently did nothing would be worse than not offering one.
 */
export default function NotebooksPage() {
  const { data, isLoading } = useCurrentSession();
  const session = data?.session ?? null;
  const start = useRequestSession();

  return (
    <PageLayout
      title="Notebooks"
      subtitle="A Jupyter kernel of your own, for working through course material and datasets."
      actions={[
        session && isLive(session) ? (
          <StopButton key="stop" sessionId={session.id} />
        ) : (
          <Button key="start" disabled={start.isPending} onClick={() => start.mutate()}>
            <NotebookPen className="size-3.5" />
            {start.isPending ? "Starting…" : "Start a notebook"}
          </Button>
        ),
      ]}
    >
      {isLoading ? (
        <Skeleton skeleton="page" />
      ) : session ? (
        <SessionCard session={session} />
      ) : (
        <div className="border-hairline bg-card rounded-xs border px-6 py-12 text-center">
          <NotebookPen className="text-muted-foreground mx-auto size-8" strokeWidth={1.5} />
          <p className="font-heading text-ink mt-3 text-lg">No notebook running</p>
          <p className="text-muted-foreground mx-auto mt-1 max-w-prose text-sm">
            Starting one gives you a kernel for up to two hours. It&apos;s reclaimed after 15
            minutes of inactivity — your files are kept, the kernel is not.
          </p>
        </div>
      )}

      {/* Stated rather than implied by an absent button: somebody who starts a
          session and finds no way to run code should be told why, not left to
          conclude the page is broken. */}
      <div className="border-hairline bg-muted/40 rounded-xs border px-4 py-3 text-sm">
        <p className="text-ink font-medium">Code execution isn&apos;t live yet</p>
        <p className="text-muted-foreground mt-1">
          Sessions start, heartbeat, expire and stop for real — the sandboxed runtime that actually
          executes cells is the remaining piece. Until it lands, a session is a reservation rather
          than a working kernel.
        </p>
      </div>
    </PageLayout>
  );
}

const StopButton = ({ sessionId }: { sessionId: string }) => {
  const stop = useStopSession(sessionId);
  return (
    <Button variant="outline" disabled={stop.isPending} onClick={() => stop.mutate()}>
      <Square className="size-3.5" />
      {stop.isPending ? "Stopping…" : "Stop"}
    </Button>
  );
};

const STATUS_META: Record<
  NotebookSession["status"],
  { label: string; variant: "success" | "outline" | "destructive"; note: string }
> = {
  pending: { label: "Queued", variant: "outline", note: "Accepted — nothing is running yet." },
  starting: {
    label: "Starting",
    variant: "outline",
    note: "Pulling the image and booting the kernel.",
  },
  running: { label: "Running", variant: "success", note: "The kernel is up and answering." },
  stopping: {
    label: "Stopping",
    variant: "outline",
    note: "Teardown asked for; waiting on the runtime.",
  },
  stopped: {
    label: "Stopped",
    variant: "outline",
    note: "The kernel is gone. Your files were kept.",
  },
  failed: { label: "Failed", variant: "destructive", note: "It never came up, or it died." },
};

const SessionCard = ({ session }: { session: NotebookSession }) => {
  const meta = STATUS_META[session.status];
  const live = isLive(session);
  const heartbeat = useHeartbeat(session.id);

  // The client's half of the idle bargain: no heartbeat for 15 minutes and the
  // reaper takes the kernel back. Sent on an interval rather than on activity so
  // a long-running cell with nobody typing is not mistaken for an idle tab —
  // closing the tab stops the beats, which is exactly the signal wanted.
  const { mutate: beat } = heartbeat;
  useEffect(() => {
    if (!live) return;
    const id = window.setInterval(() => beat(), 60_000);
    return () => window.clearInterval(id);
  }, [live, beat]);

  return (
    <div className="border-hairline bg-card space-y-4 rounded-xs border p-4">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div className="flex items-center gap-2.5">
          {session.status === "pending" || session.status === "starting" ? (
            <Loader2 className="text-muted-foreground size-4 animate-spin" />
          ) : session.status === "failed" ? (
            <AlertTriangle className="text-destructive size-4" />
          ) : (
            <NotebookPen className="text-muted-foreground size-4" />
          )}
          <Badge variant={meta.variant}>{meta.label}</Badge>
          <span className="text-muted-foreground text-sm">{meta.note}</span>
        </div>
        <code className="text-muted-foreground font-code text-xs">{session.image}</code>
      </div>

      {session.stoppedReason && (
        <p className="text-muted-foreground text-sm">
          Reason: <span className="text-ink">{session.stoppedReason}</span>
        </p>
      )}

      {live && <Countdown expiresAt={session.expiresAt} />}
    </div>
  );
};

/**
 * Time left on the absolute lifetime cap.
 *
 * Shown because the cap is real and silent: a session ends at two hours whether
 * or not the kernel is busy, and finding that out by losing your place is the
 * version of this feature people complain about.
 */
const Countdown = ({ expiresAt }: { expiresAt: string }) => {
  const expiry = useMemo(() => new Date(expiresAt).getTime(), [expiresAt]);
  const [now, setNow] = useState(() => Date.now());

  useEffect(() => {
    const id = window.setInterval(() => setNow(Date.now()), 30_000);
    return () => window.clearInterval(id);
  }, []);

  const remaining = Math.max(0, expiry - now);
  const hours = Math.floor(remaining / 3_600_000);
  const minutes = Math.floor((remaining % 3_600_000) / 60_000);

  return (
    <p className="text-muted-foreground flex items-center gap-2 text-sm">
      <Clock className="size-3.5 shrink-0" />
      {remaining === 0 ? (
        "Past its time limit — it will be reclaimed shortly."
      ) : (
        <>
          {hours > 0 && `${hours}h `}
          {minutes}m left on this session
        </>
      )}
    </p>
  );
};
