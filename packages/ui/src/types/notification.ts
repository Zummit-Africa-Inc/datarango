export type NotificationChannel = "email" | "in_app" | "push";

export type NotificationStatus =
  "pending" | "sending" | "sent" | "delivered" | "failed" | "bounced";

export interface Notification {
  id: string;
  userId: string;
  channel: NotificationChannel;
  template: string;
  status: NotificationStatus;
  readAt?: string;
  createdAt: Date;
}

export interface InAppNotification {
  id: string;
  title: string;
  body: string;
  actionUrl?: string;
  readAt?: string;
  createdAt: Date;
}
