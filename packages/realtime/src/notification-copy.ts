import type { InboxEntry } from "./types";

/**
 * Turns an inbox entry into something a person can read and click.
 *
 * Copy lives on the client rather than the server because the server cannot
 * write the link: only the frontend knows that a completed course lives at
 * `/dashboard/courses/{id}`. A rendered string from the API would arrive as
 * inert text.
 *
 * The fallback is the point of the whole file. Templates are added on the
 * backend — the notification module ships a new one and deploys — so a client
 * that only understands the templates it was built against will meet unknown
 * ones in production. An unknown template renders as a plain, dated entry
 * rather than a blank row, so the worst outcome is vague wording, never a
 * notification that silently isn't there.
 */
export interface NotificationCopy {
  title: string;
  body?: string;
  href?: string;
}

const text = (payload: Record<string, unknown>, key: string): string | undefined => {
  const value = payload[key];
  return typeof value === "string" && value.trim() !== "" ? value : undefined;
};

export const notificationCopy = (entry: InboxEntry): NotificationCopy => {
  const { payload } = entry;

  switch (entry.template) {
    case "course-completed": {
      const courseId = text(payload, "courseId");
      return {
        title: "Course completed",
        body: "You finished every module. Your certificate is ready.",
        href: courseId ? `/dashboard/courses/${courseId}` : "/dashboard/certificates",
      };
    }

    case "course-assigned": {
      const courseId = text(payload, "courseId");
      return {
        title: "A course was assigned to you",
        // The org's name is not in the event — it carries an org id, and
        // resolving names is the accounts service's job. Saying "your
        // organisation" is honest; inventing a name would not be.
        body: "Your organisation added this course to your learning.",
        href: courseId ? `/dashboard/courses/${courseId}` : "/dashboard/courses",
      };
    }

    case "certificate": {
      const serial = text(payload, "serial");
      const courseTitle = text(payload, "courseTitle");
      return {
        title: "Certificate issued",
        body: courseTitle ? `Your certificate for ${courseTitle} is ready.` : undefined,
        // The public verification page, not the private list — this is the link
        // people actually send to somebody else.
        href: serial ? `/verify/${serial}` : "/dashboard/certificates",
      };
    }

    default:
      return { title: "New notification" };
  }
};
