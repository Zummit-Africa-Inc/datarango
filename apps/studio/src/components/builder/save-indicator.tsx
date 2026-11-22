"use client";

import { useIsMutating, useMutationState } from "@tanstack/react-query";
import { Check, Loader2 } from "lucide-react";
import { useEffect, useState } from "react";

const relative = (since: number, now: number) => {
  const seconds = Math.round((now - since) / 1000);
  if (seconds < 10) return "just now";
  if (seconds < 60) return `${seconds}s ago`;
  const minutes = Math.round(seconds / 60);
  return minutes < 60 ? `${minutes} min ago` : "a while ago";
};

/**
 * "Saving…" / "Saved · just now" (§7.6). Every builder edit is a server
 * mutation that saves as it goes, so the indicator reads the mutation cache
 * rather than keeping a draft store of its own.
 */
export const SaveIndicator = () => {
  const saving = useIsMutating() > 0;
  const savedAt = useMutationState({
    filters: { status: "success" },
    select: (mutation) => mutation.state.submittedAt,
  });
  const failed = useMutationState({
    filters: { status: "error" },
    select: (mutation) => mutation.state.submittedAt,
  });
  const lastSaved = Math.max(0, ...savedAt);
  const lastFailed = Math.max(0, ...failed);

  const [now, setNow] = useState(() => Date.now());
  useEffect(() => {
    const id = setInterval(() => setNow(Date.now()), 15_000);
    return () => clearInterval(id);
  }, []);

  if (saving) {
    return (
      <span role="status" className="text-foreground-muted flex items-center gap-1.5 text-xs">
        <Loader2 aria-hidden="true" className="size-3.5 animate-spin" />
        Saving…
      </span>
    );
  }
  if (lastFailed > lastSaved) {
    return (
      <span role="status" className="text-danger text-xs font-medium">
        Last change didn&apos;t save
      </span>
    );
  }
  if (!lastSaved) return null;
  return (
    <span role="status" className="text-foreground-muted flex items-center gap-1.5 text-xs">
      <Check aria-hidden="true" className="text-success size-3.5" />
      Saved · {relative(lastSaved, Math.max(now, lastSaved))}
    </span>
  );
};
