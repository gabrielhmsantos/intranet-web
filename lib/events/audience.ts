import "server-only";

import type { SupabaseClient } from "@supabase/supabase-js";
import { MAX_SELECTED_EMPLOYEES } from "@/lib/events/schemas";
import type { EventAudience, EventAudienceType } from "@/lib/events/types";

export { MAX_SELECTED_EMPLOYEES };

type AudienceInput = {
  type: EventAudienceType;
  departmentId?: string | null;
  employeeIds?: string[];
};

export async function resolveRecipientUserIds(
  supabase: SupabaseClient,
  tenantId: string,
  audience: AudienceInput,
): Promise<string[]> {
  if (audience.type === "company") {
    const { data } = await supabase
      .from("employees")
      .select("user_id")
      .eq("tenant_id", tenantId)
      .eq("status", "active")
      .not("user_id", "is", null);

    return uniqueUserIds((data ?? []).map((row) => row.user_id as string));
  }

  if (audience.type === "department") {
    if (!audience.departmentId) return [];

    const { data } = await supabase
      .from("employees")
      .select("user_id")
      .eq("tenant_id", tenantId)
      .eq("status", "active")
      .eq("department_id", audience.departmentId)
      .not("user_id", "is", null);

    return uniqueUserIds((data ?? []).map((row) => row.user_id as string));
  }

  const ids = (audience.employeeIds ?? []).slice(0, MAX_SELECTED_EMPLOYEES);
  if (ids.length === 0) return [];

  const { data } = await supabase
    .from("employees")
    .select("user_id")
    .eq("tenant_id", tenantId)
    .eq("status", "active")
    .in("id", ids)
    .not("user_id", "is", null);

  return uniqueUserIds((data ?? []).map((row) => row.user_id as string));
}

function uniqueUserIds(ids: string[]): string[] {
  return [...new Set(ids.filter(Boolean))];
}

export async function loadEventAudience(
  supabase: SupabaseClient,
  eventId: string,
  row: {
    audience_type: EventAudienceType;
    audience_department_id: string | null;
  },
): Promise<EventAudience> {
  if (row.audience_type === "company") {
    return { type: "company" };
  }

  if (row.audience_type === "department") {
    let departmentName: string | null = null;
    if (row.audience_department_id) {
      const { data } = await supabase
        .from("departments")
        .select("name")
        .eq("id", row.audience_department_id)
        .maybeSingle();
      departmentName = (data?.name as string | undefined) ?? null;
    }

    return {
      type: "department",
      departmentId: row.audience_department_id,
      departmentName,
    };
  }

  const { data: links } = await supabase
    .from("event_audience_employees")
    .select("employee_id, employees(display_name)")
    .eq("event_id", eventId);

  const employeeIds: string[] = [];
  const employeeNames: string[] = [];

  for (const link of links ?? []) {
    employeeIds.push(link.employee_id as string);
    const emp = link.employees as { display_name: string } | { display_name: string }[] | null;
    const name = Array.isArray(emp) ? emp[0]?.display_name : emp?.display_name;
    if (name) employeeNames.push(name);
  }

  return {
    type: "employees",
    employeeIds,
    employeeNames,
  };
}
