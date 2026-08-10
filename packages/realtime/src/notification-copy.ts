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

    case "course-rejected": {
      const courseId = text(payload, "courseId");
      const reason = text(payload, "reason");
      return {
        title: "Your course needs changes",
        // The reviewer's own words, verbatim. Summarising them would throw away
        // the only part that tells the creator what to do — and requiring a
        // reason on the backend and then not showing it would make the whole
        // rule pointless.
        body: reason,
        // Straight into the builder, which is where the fixing happens.
        href: courseId ? `/courses/${courseId}` : "/courses",
      };
    }

    case "course-published": {
      const courseId = text(payload, "courseId");
      const title = text(payload, "title");
      return {
        title: "Your course is live",
        body: title ? `${title} passed review and is now published.` : "It passed review.",
        href: courseId ? `/courses/${courseId}` : "/courses",
      };
    }

    case "media-failed": {
      const error = text(payload, "error");
      return {
        title: "An upload couldn't be processed",
        // Carried through from the media module, which writes these for a
        // person ("sent as text/html but the ticket was issued for image/png").
        body: error,
        href: "/media",
      };
    }

    default:
      return { title: "New notification" };
  }
};
