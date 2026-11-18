import type { ProductRole } from "@/lib/roles";
import { canMutateEmployees } from "@/lib/people-roles";

export type EmployeeDetailPermissions = {
  canEdit: boolean;
  canInvite: boolean;
  canDeactivate: boolean;
  canReactivate: boolean;
};

export function employeeDetailPermissions(
  role: ProductRole,
  status: "active" | "inactive",
  hasAccount: boolean,
  hasWorkEmail: boolean,
): EmployeeDetailPermissions {
  const canMutate = canMutateEmployees(role);
  return {
    canEdit: canMutate && status === "active",
    canInvite:
      canMutate && status === "active" && !hasAccount && hasWorkEmail,
    canDeactivate: canMutate && status === "active",
    canReactivate: canMutate && status === "inactive",
  };
}
