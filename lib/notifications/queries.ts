import type { SupabaseClient } from "@supabase/supabase-js";
import { cutoff90dIso } from "@/lib/notifications/format";
import type {
  NotificationFilter,
  NotificationListResult,
  NotificationRow,
} from "@/lib/notifications/types";

const SELECT_COLUMNS =
  "id, title, body, kind, event_id, read_at, created_at";

export class NotificationAuthError extends Error {
  constructor(message = "Sessão expirada. Inicie sessão novamente.") {
    super(message);
    this.name = "NotificationAuthError";
  }
}

function mapAuthError(error: { message?: string; code?: string } | null): void {
  if (!error) return;
  const msg = error.message?.toLowerCase() ?? "";
  if (
    error.code === "PGRST301" ||
    msg.includes("jwt") ||
    msg.includes("session") ||
    msg.includes("not authenticated")
  ) {
    throw new NotificationAuthError();
  }
}

export async function listNotifications(
  supabase: SupabaseClient,
  options: {
    timeZone: string;
    filter: NotificationFilter;
    page: number;
    pageSize?: number;
  },
): Promise<NotificationListResult> {
  const pageSize = options.pageSize ?? 20;
  const offset = (options.page - 1) * pageSize;
  const cutoff = cutoff90dIso(options.timeZone);

  let builder = supabase
    .from("notifications")
    .select(SELECT_COLUMNS, { count: "exact" })
    .gte("created_at", cutoff)
    .order("created_at", { ascending: false })
    .range(offset, offset + pageSize - 1);

  if (options.filter === "unread") {
    builder = builder.is("read_at", null);
  }

  const { data, error, count } = await builder;
  mapAuthError(error);
  if (error) throw new Error(error.message);

  return {
    items: (data ?? []) as NotificationRow[],
    total: count ?? 0,
  };
}

export async function previewNotifications(
  supabase: SupabaseClient,
  timeZone: string,
  options?: { limit?: number },
): Promise<NotificationRow[]> {
  const limit = options?.limit ?? 8;
  const cutoff = cutoff90dIso(timeZone);
  const { data, error } = await supabase
    .from("notifications")
    .select(SELECT_COLUMNS)
    .gte("created_at", cutoff)
    .order("created_at", { ascending: false })
    .limit(limit);

  mapAuthError(error);
  if (error) throw new Error(error.message);
  return (data ?? []) as NotificationRow[];
}

export async function countUnread(
  supabase: SupabaseClient,
  timeZone: string,
): Promise<number> {
  const cutoff = cutoff90dIso(timeZone);
  const { count, error } = await supabase
    .from("notifications")
    .select("id", { count: "exact", head: true })
    .gte("created_at", cutoff)
    .is("read_at", null);

  mapAuthError(error);
  if (error) throw new Error(error.message);
  return count ?? 0;
}

export async function markRead(
  supabase: SupabaseClient,
  notificationId: string,
): Promise<void> {
  const { error } = await supabase
    .from("notifications")
    .update({ read_at: new Date().toISOString() })
    .eq("id", notificationId)
    .is("read_at", null);

  mapAuthError(error);
  if (error) throw new Error(error.message);
}

export async function markAllRead(
  supabase: SupabaseClient,
  timeZone: string,
): Promise<void> {
  const cutoff = cutoff90dIso(timeZone);
  const { error } = await supabase
    .from("notifications")
    .update({ read_at: new Date().toISOString() })
    .is("read_at", null)
    .gte("created_at", cutoff);

  mapAuthError(error);
  if (error) throw new Error(error.message);
}
