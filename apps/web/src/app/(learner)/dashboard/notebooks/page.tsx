"use client";

import { Suspense, useCallback, useEffect, useMemo, useState } from "react";
import { usePathname, useRouter, useSearchParams } from "next/navigation";
import { AlertTriangle, History, Loader2, NotebookPen, Plus, Square } from "lucide-react";

import { NotebookWorkspace, useNewNotebook } from "@datarango/notebook";
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
 * Once the session is running, the notebook workspace (`@datarango/notebook`)
 * opens below it: an editor whose cells run on the session's kernel, with the
 * learner's `.ipynb` files (on their home volume) in a History side panel. New
 * notebook and History sit in the header beside Stop. The open file is kept in
 * the URL (`?file=`) so a reload or a shared link reopens it.
 */
export default function NotebooksPage() {
  // useSearchParams needs a Suspense boundary to keep the route prerenderable.
  return (
    <Suspense fallback={<Skeleton skeleton="page" />}>
      <Notebooks />
    </Suspense>
  );
}

/** The open notebook, mirrored into `?file=`. */
const useOpenFile = () => {
  const router = useRouter();
  const pathname = usePathname();
  const params = useSearchParams();
  const file = params.get("file");

  const open = useCallback(
    (path: string | null) => {
      const next = new URLSearchParams(params.toString());
      if (path) next.set("file", path);
      else next.delete("file");
      const qs = next.toString();
      router.replace(qs ? `${pathname}?${qs}` : pathname, { scroll: false });
    },
    [params, pathname, router],
  );

  return [file, open] as const;
};

const Notebooks = () => {
  const { data, isLoading } = useCurrentSession();
  const session = data?.session ?? null;
  const start = useRequestSession();
  const [file, openFile] = useOpenFile();
  const [historyOpen, setHistoryOpen] = useState(false);
  const running = session?.status === "running";

  return (
    <PageLayout
      title="Notebooks"
      subtitle="A Jupyter kernel of your own, for working through course material and datasets."
      actions={[
        ...(session && running
          ? [
              <NewNotebookButton key="new" sessionId={session.id} onOpen={openFile} />,
              <Button key="history" variant="outline" onClick={() => setHistoryOpen(true)}>
                <History className="size-3.5" />
                History
              </Button>,
            ]
          : []),
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
        <>
          <SessionCard session={session} />
          {running && (
            <NotebookWorkspace
              sessionId={session.id}
              path={file}
              onOpen={openFile}
              historyOpen={historyOpen}
              onHistoryOpenChange={setHistoryOpen}
            />
          )}
        </>
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
    </PageLayout>
  );
};

const NewNotebookButton = ({
  sessionId,
  onOpen,
}: {
  sessionId: string;
  onOpen: (path: string) => void;
}) => {
  const { create, creating } = useNewNotebook(sessionId, onOpen);
  return (
    <Button variant="outline" disabled={creating} onClick={() => void create()}>
      {creating ? <Loader2 className="size-3.5 animate-spin" /> : <Plus className="size-3.5" />}
      New notebook
    </Button>
  );
};

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

  // One line: status, what it means, time left — the image off to the right.
  return (
    <div className="border-hairline bg-card flex flex-wrap items-center gap-x-2.5 gap-y-1 rounded-xs border px-4 py-2.5">
      {session.status === "pending" || session.status === "starting" ? (
        <Loader2 className="text-muted-foreground size-4 animate-spin" />
      ) : session.status === "failed" ? (
        <AlertTriangle className="text-destructive size-4" />
      ) : (
        <NotebookPen className="text-muted-foreground size-4" />
      )}
      <Badge variant={meta.variant}>{meta.label}</Badge>
      <span className="text-muted-foreground text-sm">
        {meta.note}
        {live && (
          <>
            {" "}
            (<Countdown expiresAt={session.expiresAt} />)
          </>
        )}
        {session.stoppedReason && (
          <>
            {" "}
            Reason: <span className="text-ink">{session.stoppedReason}</span>
          </>
        )}
      </span>
      <code className="text-muted-foreground font-code ml-auto text-xs">{session.image}</code>
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

  return remaining === 0 ? (
    <>past its time limit, reclaimed shortly</>
  ) : (
    <>
      {hours > 0 && `${hours}h `}
      {minutes}m left
    </>
  );
};
