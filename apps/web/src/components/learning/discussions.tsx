"use client";

import { MessagesSquare } from "lucide-react";

/**
 * Placeholder. There is no discussions backend yet — no thread, post or comment
 * concept exists in the learning service, so there is nothing to read and
 * nowhere to write. Deliberately renders no composer: an input that discards
 * what you type is worse than an empty state that says so.
 *
 * When the slice lands this takes `courseId` and renders the thread list.
 */
export const Discussions = () => (
  <div className="border-hairline bg-card rounded-xs border px-6 py-12 text-center">
    <MessagesSquare className="text-muted-foreground mx-auto size-8" strokeWidth={1.5} />
    <p className="text-ink font-heading mt-3 text-lg">Discussions aren&apos;t open yet</p>
    <p className="text-muted-foreground mx-auto mt-1 max-w-prose text-sm">
      Course discussion isn&apos;t available on this course.
    </p>
  </div>
);
