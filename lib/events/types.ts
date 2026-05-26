export type EventStatus = "active" | "canceled";

export type EventAudienceType = "company" | "department" | "employees";

export type EventAudience = {
  type: EventAudienceType;
  departmentId?: string | null;
  departmentName?: string | null;
  employeeIds?: string[];
  employeeNames?: string[];
};

export type EventListItem = {
  id: string;
  title: string;
  startsAt: string;
  endsAt: string;
  status: EventStatus;
};

export type EventListResult = {
  items: EventListItem[];
  page: number;
  pageSize: number;
  total: number;
  totalPages: number;
};

export type EventDetail = {
  id: string;
  title: string;
  description: string | null;
  location: string | null;
  startsAt: string;
  endsAt: string;
  status: EventStatus;
  audience: EventAudience;
  createdAt: string;
  updatedAt: string;
};

export type ImmediateNotificationKind =
  | "event_canceled"
  | "event_time_changed"
  | "event_location_changed";
