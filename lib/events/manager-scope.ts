import "server-only";

import type { SupabaseClient } from "@supabase/supabase-js";
import type { CreateEventBody } from "@/lib/events/schemas";
import type { EventAudience } from "@/lib/events/types";

export type ManagerScope = {
  employeeId: string;
  managedDepartments: { id: string; name: string }[];
  scopedEmployees: {
    id: string;
    fullName: string;
    departmentId: string | null;
  }[];
};

export class ManagerScopeError extends Error {
  readonly code: "NO_EMPLOYEE" | "EMPTY_SCOPE" | "INVALID_AUDIENCE";

  constructor(
    message: string,
    code: "NO_EMPLOYEE" | "EMPTY_SCOPE" | "INVALID_AUDIENCE",
  ) {
    super(message);
    this.name = "ManagerScopeError";
    this.code = code;
  }
}

export async function loadManagerScope(
  supabase: SupabaseClient,
  tenantId: string,
  employeeId: string,
): Promise<ManagerScope> {
  const { data: departments, error: deptError } = await supabase
    .from("departments")
    .select("id, name")
    .eq("tenant_id", tenantId)
    .eq("manager_employee_id", employeeId)
    .order("name");

  if (deptError) {
    throw new Error(deptError.message);
  }

  const managedDeptIds = (departments ?? []).map((d) => d.id as string);

  let employeeQuery = supabase
    .from("employees")
    .select("id, display_name, department_id")
    .eq("tenant_id", tenantId)
    .eq("status", "active")
    .order("display_name");

  if (managedDeptIds.length > 0) {
    employeeQuery = employeeQuery.or(
      `manager_id.eq.${employeeId},department_id.in.(${managedDeptIds.join(",")})`,
    );
  } else {
    employeeQuery = employeeQuery.eq("manager_id", employeeId);
  }

  const { data: employees, error: empError } = await employeeQuery;

  if (empError) {
    throw new Error(empError.message);
  }

  const scopedEmployees = (employees ?? []).map((e) => ({
    id: e.id as string,
    fullName: e.display_name as string,
    departmentId: (e.department_id as string | null) ?? null,
  }));

  return {
    employeeId,
    managedDepartments: (departments ?? []).map((d) => ({
      id: d.id as string,
      name: d.name as string,
    })),
    scopedEmployees,
  };
}

export function assertAudienceAllowed(
  scope: ManagerScope,
  audience: CreateEventBody["audience"],
): void {
  if (audience.type === "company") {
    throw new ManagerScopeError(
      "Gestores não podem criar eventos para toda a empresa.",
      "INVALID_AUDIENCE",
    );
  }

  if (audience.type === "department") {
    const deptId = audience.departmentId;
    if (!deptId || !scope.managedDepartments.some((d) => d.id === deptId)) {
      throw new ManagerScopeError(
        "Departamento fora do âmbito da sua equipa.",
        "INVALID_AUDIENCE",
      );
    }
    return;
  }

  const ids = audience.employeeIds ?? [];
  const allowed = new Set(scope.scopedEmployees.map((e) => e.id));
  for (const id of ids) {
    if (!allowed.has(id)) {
      throw new ManagerScopeError(
        "Um ou mais colaboradores estão fora do âmbito da sua equipa.",
        "INVALID_AUDIENCE",
      );
    }
  }
}

export function isAudienceUnchanged(
  existing: EventAudience,
  incoming: CreateEventBody["audience"] | undefined,
): boolean {
  if (!incoming) {
    return true;
  }

  if (existing.type !== incoming.type) {
    return false;
  }

  if (incoming.type === "department") {
    return (existing.departmentId ?? null) === (incoming.departmentId ?? null);
  }

  if (incoming.type === "employees") {
    const a = [...(existing.employeeIds ?? [])].sort();
    const b = [...(incoming.employeeIds ?? [])].sort();
    return a.length === b.length && a.every((v, i) => v === b[i]);
  }

  return true;
}

export function hasManagerScope(scope: ManagerScope): boolean {
  return scope.managedDepartments.length > 0 || scope.scopedEmployees.length > 0;
}
