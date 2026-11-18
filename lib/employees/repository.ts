import "server-only";

import type { SupabaseClient } from "@supabase/supabase-js";
import { createAdminClient } from "@/lib/supabase/admin";
import { canListInactive, canViewEmployeeAccess } from "@/lib/people-roles";
import type { ProductRole } from "@/lib/roles";
import {
  assertValidManagerAssignment,
  ManagerGraphError,
  type ManagerEdge,
} from "@/lib/employees/manager-graph";
import {
  assertCanDeactivate,
  DeactivateBlockedError,
} from "@/lib/employees/deactivate-guards";
import { employeeDetailPermissions } from "@/lib/employees/permissions";
import type {
  CreateEmployeeBody,
  ListEmployeesQuery,
  UpdateEmployeeBody,
} from "@/lib/employees/schemas";
import type {
  EmployeeDetail,
  EmployeeListItem,
  EmployeeListResult,
  InviteStatus,
} from "@/lib/employees/types";

type EmployeeRow = {
  id: string;
  tenant_id: string;
  display_name: string;
  work_email: string | null;
  user_id: string | null;
  status: "active" | "inactive";
  department_id: string | null;
  manager_id: string | null;
  extension_number: string | null;
  departments: { name: string } | { name: string }[] | null;
};

function departmentName(row: EmployeeRow): string | null {
  const d = row.departments;
  if (!d) return null;
  const one = Array.isArray(d) ? d[0] : d;
  return one?.name ?? null;
}

function resolveInviteStatus(
  userId: string | null,
  pendingInviteEmployeeIds: Set<string>,
  employeeId: string,
): InviteStatus {
  if (userId) return "active";
  if (pendingInviteEmployeeIds.has(employeeId)) return "pending";
  return "none";
}

async function loadPendingInviteEmployeeIds(
  supabase: SupabaseClient,
  tenantId: string,
  employeeIds: string[],
): Promise<Set<string>> {
  if (employeeIds.length === 0) return new Set();

  const { data } = await supabase
    .from("invite_tokens")
    .select("employee_id")
    .eq("tenant_id", tenantId)
    .eq("status", "pending")
    .in("employee_id", employeeIds);

  return new Set((data ?? []).map((r) => r.employee_id as string));
}

export async function listEmployees(
  supabase: SupabaseClient,
  tenantId: string,
  role: ProductRole,
  query: ListEmployeesQuery,
): Promise<EmployeeListResult> {
  const includeInactive = query.includeInactive === true && canListInactive(role);

  let builder = supabase
    .from("employees")
    .select("id, display_name, status, user_id, departments!employees_department_id_fkey(name)", {
      count: "exact",
    })
    .eq("tenant_id", tenantId)
    .order("display_name", { ascending: true });

  if (!includeInactive) {
    builder = builder.eq("status", "active");
  }

  if (query.q) {
    builder = builder.ilike("display_name", `%${query.q}%`);
  }

  const from = (query.page - 1) * query.pageSize;
  const to = from + query.pageSize - 1;
  builder = builder.range(from, to);

  const { data, error, count } = await builder;

  if (error) {
    throw error;
  }

  const rows = (data ?? []) as EmployeeRow[];
  const showAccess = canViewEmployeeAccess(role);
  const pending = showAccess
    ? await loadPendingInviteEmployeeIds(
        supabase,
        tenantId,
        rows.map((r) => r.id),
      )
    : new Set<string>();

  const items: EmployeeListItem[] = rows.map((row) => {
    const item: EmployeeListItem = {
      id: row.id,
      displayName: row.display_name,
      departmentName: departmentName(row),
      status: row.status,
    };
    if (showAccess) {
      item.hasAccount = Boolean(row.user_id);
      item.inviteStatus = resolveInviteStatus(row.user_id, pending, row.id);
    }
    return item;
  });

  return {
    items,
    page: query.page,
    pageSize: query.pageSize,
    total: count ?? items.length,
  };
}

export async function getEmployeeById(
  supabase: SupabaseClient,
  tenantId: string,
  role: ProductRole,
  employeeId: string,
): Promise<EmployeeDetail | null> {
  const { data, error } = await supabase
    .from("employees")
    .select(
      "id, display_name, work_email, user_id, status, department_id, manager_id, extension_number, departments!employees_department_id_fkey(name)",
    )
    .eq("tenant_id", tenantId)
    .eq("id", employeeId)
    .maybeSingle();

  if (error) {
    throw error;
  }

  if (!data) {
    return null;
  }

  const row = data as EmployeeRow;

  if (row.status === "inactive" && !canListInactive(role)) {
    return null;
  }

  const showAccess = canViewEmployeeAccess(role);
  const hasAccount = Boolean(row.user_id);
  const hasWorkEmail = Boolean(row.work_email?.trim());
  const perms = employeeDetailPermissions(
    role,
    row.status,
    hasAccount,
    hasWorkEmail,
  );
  const pending = showAccess
    ? await loadPendingInviteEmployeeIds(supabase, tenantId, [row.id])
    : new Set<string>();

  let managerName: string | null = null;
  if (row.manager_id) {
    const { data: mgr } = await supabase
      .from("employees")
      .select("display_name")
      .eq("id", row.manager_id)
      .maybeSingle();
    managerName = (mgr?.display_name as string | undefined) ?? null;
  }

  return {
    id: row.id,
    displayName: row.display_name,
    workEmail: row.work_email,
    departmentId: row.department_id,
    departmentName: departmentName(row),
    managerId: row.manager_id,
    managerName,
    extensionNumber: row.extension_number,
    status: row.status,
    ...(showAccess
      ? {
          hasAccount,
          inviteStatus: resolveInviteStatus(row.user_id, pending, row.id),
        }
      : {}),
    ...perms,
  };
}

async function loadManagerEdges(
  supabase: SupabaseClient,
  tenantId: string,
): Promise<ManagerEdge[]> {
  const { data, error } = await supabase
    .from("employees")
    .select("id, manager_id")
    .eq("tenant_id", tenantId)
    .eq("status", "active");

  if (error) throw error;
  return (data ?? []).map((r) => ({
    id: r.id as string,
    managerId: (r.manager_id as string | null) ?? null,
  }));
}

export async function createEmployee(
  supabase: SupabaseClient,
  tenantId: string,
  body: CreateEmployeeBody,
): Promise<{ id: string }> {
  const edges = await loadManagerEdges(supabase, tenantId);
  const provisionalId = crypto.randomUUID();

  try {
    assertValidManagerAssignment(provisionalId, body.managerId ?? null, [
      ...edges,
      { id: provisionalId, managerId: body.managerId ?? null },
    ]);
  } catch (e) {
    if (e instanceof ManagerGraphError) {
      throw e;
    }
    throw e;
  }

  const { data, error } = await supabase
    .from("employees")
    .insert({
      tenant_id: tenantId,
      display_name: body.displayName,
      work_email: body.workEmail ?? null,
      department_id: body.departmentId ?? null,
      manager_id: body.managerId ?? null,
      extension_number: body.extensionNumber ?? null,
      status: "active",
    })
    .select("id")
    .single();

  if (error) {
    if (error.code === "23505") {
      const dup = new Error("E-mail já utilizado por colaborador activo.");
      (dup as Error & { statusCode: number }).statusCode = 409;
      throw dup;
    }
    throw error;
  }

  return { id: data.id as string };
}

export async function updateEmployee(
  supabase: SupabaseClient,
  tenantId: string,
  employeeId: string,
  body: UpdateEmployeeBody,
): Promise<void> {
  const edges = await loadManagerEdges(supabase, tenantId);
  const nextManagerId =
    body.managerId !== undefined
      ? body.managerId
      : (edges.find((e) => e.id === employeeId)?.managerId ?? null);

  try {
    assertValidManagerAssignment(employeeId, nextManagerId, edges);
  } catch (e) {
    if (e instanceof ManagerGraphError) throw e;
    throw e;
  }

  const patch: Record<string, unknown> = {};
  if (body.displayName !== undefined) patch.display_name = body.displayName;
  if (body.workEmail !== undefined) patch.work_email = body.workEmail ?? null;
  if (body.departmentId !== undefined) patch.department_id = body.departmentId;
  if (body.managerId !== undefined) patch.manager_id = body.managerId;
  if (body.extensionNumber !== undefined) {
    patch.extension_number = body.extensionNumber ?? null;
  }

  const { error } = await supabase
    .from("employees")
    .update(patch)
    .eq("tenant_id", tenantId)
    .eq("id", employeeId);

  if (error) {
    if (error.code === "23505") {
      const dup = new Error("E-mail já utilizado por colaborador activo.");
      (dup as Error & { statusCode: number }).statusCode = 409;
      throw dup;
    }
    throw error;
  }
}

export async function deactivateEmployee(
  supabase: SupabaseClient,
  tenantId: string,
  employeeId: string,
): Promise<void> {
  const { data: deptRows } = await supabase
    .from("departments")
    .select("id")
    .eq("tenant_id", tenantId)
    .eq("manager_employee_id", employeeId);

  const { data: reportRows } = await supabase
    .from("employees")
    .select("id")
    .eq("tenant_id", tenantId)
    .eq("manager_id", employeeId)
    .eq("status", "active");

  assertCanDeactivate({
    employeeId,
    managedDepartmentIds: (deptRows ?? []).map((r) => r.id as string),
    activeDirectReportIds: (reportRows ?? []).map((r) => r.id as string),
  });

  const { error } = await supabase
    .from("employees")
    .update({ status: "inactive" })
    .eq("tenant_id", tenantId)
    .eq("id", employeeId)
    .eq("status", "active");

  if (error) throw error;

  const admin = createAdminClient();
  await admin
    .from("invite_tokens")
    .update({ status: "revoked" })
    .eq("tenant_id", tenantId)
    .eq("employee_id", employeeId)
    .eq("status", "pending");
}

export async function reactivateEmployee(
  supabase: SupabaseClient,
  tenantId: string,
  employeeId: string,
): Promise<void> {
  const { error } = await supabase
    .from("employees")
    .update({ status: "active" })
    .eq("tenant_id", tenantId)
    .eq("id", employeeId)
    .eq("status", "inactive");

  if (error) {
    if (error.code === "23505") {
      const dup = new Error("E-mail já utilizado por colaborador activo.");
      (dup as Error & { statusCode: number }).statusCode = 409;
      throw dup;
    }
    throw error;
  }
}

export { ManagerGraphError, DeactivateBlockedError };
