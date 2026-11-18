import type { SupabaseClient } from "@supabase/supabase-js";
import { getCivilWeekRangeUtc } from "@/lib/dashboard/week-range";
import {
  NotificationAuthError,
  previewNotifications,
} from "@/lib/notifications/queries";
import type { NotificationRow } from "@/lib/notifications/types";

export type DashboardEventRow = {
  id: string;
  title: string;
  starts_at: string;
  ends_at: string;
  status: string;
};

export type PendingInviteLabel = "Sem conta" | "Convite pendente";

export type PendingInviteRow = {
  employeeId: string;
  displayName: string;
  label: PendingInviteLabel;
};

export type PendingInvitesResult = {
  items: PendingInviteRow[];
  totalCount: number;
};

export { NotificationAuthError };

export async function fetchUpcomingEvents(
  supabase: SupabaseClient,
  limit = 5,
): Promise<DashboardEventRow[]> {
  const nowUtc = new Date().toISOString();

  const { data, error } = await supabase
    .from("events")
    .select("id, title, starts_at, ends_at, status")
    .eq("status", "active")
    .gt("starts_at", nowUtc)
    .order("starts_at", { ascending: true })
    .limit(limit);

  if (error) {
    throw new Error(error.message);
  }

  return (data ?? []) as DashboardEventRow[];
}

export async function fetchWeekEvents(
  supabase: SupabaseClient,
  timeZone: string,
  limit = 8,
  refDate: Date = new Date(),
): Promise<DashboardEventRow[]> {
  const { weekStartUtc, weekEndUtc } = getCivilWeekRangeUtc(timeZone, refDate);

  const { data, error } = await supabase
    .from("events")
    .select("id, title, starts_at, ends_at, status")
    .eq("status", "active")
    .gte("starts_at", weekStartUtc)
    .lte("starts_at", weekEndUtc)
    .order("starts_at", { ascending: true })
    .limit(limit);

  if (error) {
    throw new Error(error.message);
  }

  return (data ?? []) as DashboardEventRow[];
}

export function mergePendingInviteRows(
  employees: { id: string; display_name: string }[],
  pendingEmployeeIds: Set<string>,
  limit: number,
): PendingInvitesResult {
  const rows: PendingInviteRow[] = employees.map((emp) => ({
    employeeId: emp.id,
    displayName: emp.display_name,
    label: pendingEmployeeIds.has(emp.id) ? "Convite pendente" : "Sem conta",
  }));

  return {
    items: rows.slice(0, limit),
    totalCount: rows.length,
  };
}

export async function fetchPendingInvites(
  supabase: SupabaseClient,
  limit = 5,
): Promise<PendingInvitesResult> {
  const { data: tokens, error: tokenError } = await supabase
    .from("invite_tokens")
    .select("employee_id")
    .eq("status", "pending");

  if (tokenError) {
    throw new Error(tokenError.message);
  }

  const pendingEmployeeIds = new Set(
    (tokens ?? []).map((t) => t.employee_id as string),
  );

  const { data: employees, error: empError } = await supabase
    .from("employees")
    .select("id, display_name, user_id")
    .eq("status", "active")
    .is("user_id", null)
    .order("display_name", { ascending: true });

  if (empError) {
    throw new Error(empError.message);
  }

  return mergePendingInviteRows(
    (employees ?? []).map((e) => ({
      id: e.id as string,
      display_name: e.display_name as string,
    })),
    pendingEmployeeIds,
    limit,
  );
}

export async function fetchDashboardNotifications(
  supabase: SupabaseClient,
  timeZone: string,
  limit = 5,
): Promise<NotificationRow[]> {
  return previewNotifications(supabase, timeZone, { limit });
}
