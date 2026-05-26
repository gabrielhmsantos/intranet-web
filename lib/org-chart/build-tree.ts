export type OrgChartMember = {
  id: string;
  displayName: string;
  managerId: string | null;
};

export type OrgChartDepartment = {
  id: string;
  name: string;
  managerEmployeeId: string | null;
  members: OrgChartMember[];
};

export type OrgChartEmployeeRow = {
  id: string;
  displayName: string;
  departmentId: string | null;
  managerId: string | null;
};

export type OrgChartDepartmentRow = {
  id: string;
  name: string;
  managerEmployeeId: string | null;
};

export function buildOrgChartTree(
  departments: OrgChartDepartmentRow[],
  employees: OrgChartEmployeeRow[],
): OrgChartDepartment[] {
  const membersByDept = new Map<string, OrgChartMember[]>();

  for (const emp of employees) {
    if (!emp.departmentId) {
      continue;
    }
    const list = membersByDept.get(emp.departmentId) ?? [];
    list.push({
      id: emp.id,
      displayName: emp.displayName,
      managerId: emp.managerId,
    });
    membersByDept.set(emp.departmentId, list);
  }

  return departments.map((dept) => ({
    id: dept.id,
    name: dept.name,
    managerEmployeeId: dept.managerEmployeeId,
    members: (membersByDept.get(dept.id) ?? []).sort((a, b) =>
      a.displayName.localeCompare(b.displayName, "pt"),
    ),
  }));
}
