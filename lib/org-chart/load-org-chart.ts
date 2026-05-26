import "server-only";

import type { SupabaseClient } from "@supabase/supabase-js";
import { buildOrgChartTree, type OrgChartDepartment } from "@/lib/org-chart/build-tree";
import { listDepartments } from "@/lib/departments/repository";

export async function loadOrgChart(
  supabase: SupabaseClient,
  tenantId: string,
): Promise<OrgChartDepartment[]> {
  const departments = await listDepartments(supabase, tenantId);

  const { data: employees, error } = await supabase
    .from("employees")
    .select("id, display_name, department_id, manager_id")
    .eq("tenant_id", tenantId)
    .eq("status", "active")
    .order("display_name", { ascending: true });

  if (error) throw error;

  return buildOrgChartTree(
    departments.map((d) => ({
      id: d.id,
      name: d.name,
      managerEmployeeId: d.managerEmployeeId,
    })),
    (employees ?? []).map((e) => ({
      id: e.id as string,
      displayName: e.display_name as string,
      departmentId: (e.department_id as string | null) ?? null,
      managerId: (e.manager_id as string | null) ?? null,
    })),
  );
}
