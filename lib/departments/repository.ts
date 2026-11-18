import "server-only";

import type { SupabaseClient } from "@supabase/supabase-js";
import type {
  CreateDepartmentBody,
  UpdateDepartmentBody,
} from "@/lib/departments/schemas";

export type DepartmentListItem = {
  id: string;
  name: string;
  managerEmployeeId: string | null;
  managerName: string | null;
  activeEmployeeCount: number;
};

export class DepartmentDeleteBlockedError extends Error {
  readonly code = "DEPARTMENT_HAS_ACTIVE_EMPLOYEES" as const;

  constructor() {
    super("Existem colaboradores activos neste departamento.");
    this.name = "DepartmentDeleteBlockedError";
  }
}

export async function listDepartments(
  supabase: SupabaseClient,
  tenantId: string,
): Promise<DepartmentListItem[]> {
  const { data: departments, error } = await supabase
    .from("departments")
    .select("id, name, manager_employee_id")
    .eq("tenant_id", tenantId)
    .order("name", { ascending: true });

  if (error) throw error;

  const { data: employees, error: empError } = await supabase
    .from("employees")
    .select("department_id, display_name")
    .eq("tenant_id", tenantId)
    .eq("status", "active");

  if (empError) throw empError;

  const managerIds = (departments ?? [])
    .map((d) => d.manager_employee_id)
    .filter(Boolean) as string[];

  const managerNames = new Map<string, string>();
  if (managerIds.length > 0) {
    const { data: managers } = await supabase
      .from("employees")
      .select("id, display_name")
      .in("id", managerIds);
    for (const m of managers ?? []) {
      managerNames.set(m.id as string, m.display_name as string);
    }
  }

  const counts = new Map<string, number>();
  for (const e of employees ?? []) {
    const deptId = e.department_id as string | null;
    if (!deptId) continue;
    counts.set(deptId, (counts.get(deptId) ?? 0) + 1);
  }

  return (departments ?? []).map((d) => ({
    id: d.id as string,
    name: d.name as string,
    managerEmployeeId: (d.manager_employee_id as string | null) ?? null,
    managerName: d.manager_employee_id
      ? (managerNames.get(d.manager_employee_id as string) ?? null)
      : null,
    activeEmployeeCount: counts.get(d.id as string) ?? 0,
  }));
}

export async function createDepartment(
  supabase: SupabaseClient,
  tenantId: string,
  body: CreateDepartmentBody,
): Promise<{ id: string }> {
  const { data, error } = await supabase
    .from("departments")
    .insert({
      tenant_id: tenantId,
      name: body.name.trim(),
      manager_employee_id: body.managerEmployeeId ?? null,
    })
    .select("id")
    .single();

  if (error) {
    if (error.code === "23505") {
      const dup = new Error("Já existe um departamento com este nome.");
      (dup as Error & { statusCode: number }).statusCode = 409;
      throw dup;
    }
    throw error;
  }

  return { id: data.id as string };
}

export async function updateDepartment(
  supabase: SupabaseClient,
  tenantId: string,
  departmentId: string,
  body: UpdateDepartmentBody,
): Promise<void> {
  const patch: Record<string, unknown> = {};
  if (body.name !== undefined) patch.name = body.name.trim();
  if (body.managerEmployeeId !== undefined) {
    patch.manager_employee_id = body.managerEmployeeId;
  }

  const { error } = await supabase
    .from("departments")
    .update(patch)
    .eq("tenant_id", tenantId)
    .eq("id", departmentId);

  if (error) {
    if (error.code === "23505") {
      const dup = new Error("Já existe um departamento com este nome.");
      (dup as Error & { statusCode: number }).statusCode = 409;
      throw dup;
    }
    throw error;
  }
}

export async function deleteDepartment(
  supabase: SupabaseClient,
  tenantId: string,
  departmentId: string,
): Promise<void> {
  const { count, error: countError } = await supabase
    .from("employees")
    .select("id", { count: "exact", head: true })
    .eq("tenant_id", tenantId)
    .eq("department_id", departmentId)
    .eq("status", "active");

  if (countError) throw countError;
  if ((count ?? 0) > 0) {
    throw new DepartmentDeleteBlockedError();
  }

  const { error } = await supabase
    .from("departments")
    .delete()
    .eq("tenant_id", tenantId)
    .eq("id", departmentId);

  if (error) throw error;
}
