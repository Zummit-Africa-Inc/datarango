/**
 * The in-app inbox wire types, matching the platform module's projection.
 *
 * `payload` is deliberately unstructured here: the server hands over the
 * event's own fields untouched, and each template's copy narrows it in
 * `notification-copy.ts`. Typing it as a union of every known template would
 * mean a new server-side template is a compile error in the client before it is
 * a missing copy entry — the wrong order, since the notification should still
 * render.
 */
export interface InboxEntry {
  id: string;
  template: string;
  category: string;
  payload: Record<string, unknown>;
  createdAt: string;
  readAt: string | null;
}

/** One page of the inbox, plus the badge count for the whole inbox. */
export interface InboxPage {
  items: InboxEntry[];
  nextCursor: string | null;
  unreadCount: number;
}

export interface UnreadCount {
  unreadCount: number;
}

export interface MarkReadResult {
  marked: number;
  unreadCount: number;
}
