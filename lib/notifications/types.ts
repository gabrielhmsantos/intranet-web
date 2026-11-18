export type NotificationFilter = "all" | "unread";

export type ImmediateNotificationKind =
  | "event_canceled"
  | "event_time_changed"
  | "event_location_changed";

export type ScheduledNotificationKind =
  | "event_day"
  | "event_reminder_1h"
  | "event_reminder_15m";

export type NotificationKind =
  | ImmediateNotificationKind
  | ScheduledNotificationKind;

export type NotificationRow = {
  id: string;
  title: string;
  body: string;
  kind: NotificationKind;
  event_id: string | null;
  read_at: string | null;
  created_at: string;
};

export type NotificationListResult = {
  items: NotificationRow[];
  total: number;
};
