"use client";

import { Badge } from "@datarango/ui";

import type { MediaStatus } from "@/hooks/media";

/**
 * The upload lifecycle, said plainly.
 *
 * `uploaded` and `processing` are kept apart because for video they are
 * genuinely different waits — the bytes have arrived, but nothing can play them
 * until Mux finishes transcoding. Collapsing the two into "done" would tell a
 * creator their lesson has a video several minutes before it has one.
 */
const LABELS: Record<
  MediaStatus,
  { text: string; variant: "outline" | "warning" | "success" | "destructive" }
> = {
  pending: { text: "Not uploaded", variant: "outline" },
  uploaded: { text: "Uploaded", variant: "outline" },
  processing: { text: "Processing", variant: "warning" },
  ready: { text: "Ready", variant: "success" },
  failed: { text: "Failed", variant: "destructive" },
};

export const MediaStatusBadge = ({ status }: { status: MediaStatus }) => {
  const { text, variant } = LABELS[status];
  return <Badge variant={variant}>{text}</Badge>;
};
