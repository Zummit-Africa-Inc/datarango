"use client";

import { Paperclip } from "lucide-react";

/**
 * Placeholder. There is no resources backend yet — the learning service exposes
 * no course-attachment concept in its catalog RPC surface, and `platform.media`
 * assets are owner-scoped to the creator under RLS, so a learner could not read
 * them even if a course pointed at one. Shipping the tab with an honest empty
 * state keeps the tab bar coherent; it is not waiting on data that exists.
 *
 * When the slice lands this takes `courseId` and lists the attachments for it.
 */
export const Resources = () => (
  <div className="border-hairline bg-card rounded-xs border px-6 py-12 text-center">
    <Paperclip className="text-muted-foreground mx-auto size-8" strokeWidth={1.5} />
    <p className="text-ink font-heading mt-3 text-lg">No resources yet</p>
    <p className="text-muted-foreground mx-auto mt-1 max-w-prose text-sm">
      Slides, datasets and any files the creator attaches to this course will appear here.
    </p>
  </div>
);
