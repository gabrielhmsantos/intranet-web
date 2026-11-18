export type DeactivateGuardInput = {
  employeeId: string;
  managedDepartmentIds: string[];
  activeDirectReportIds: string[];
};

export class DeactivateBlockedError extends Error {
  readonly code = "DEACTIVATE_BLOCKED" as const;

  constructor(message: string) {
    super(message);
    this.name = "DeactivateBlockedError";
  }
}

export function assertCanDeactivate(input: DeactivateGuardInput): void {
  if (input.managedDepartmentIds.length > 0) {
    throw new DeactivateBlockedError(
      "Não é possível desactivar: colaborador é gestor de departamento.",
    );
  }

  if (input.activeDirectReportIds.length > 0) {
    throw new DeactivateBlockedError(
      "Não é possível desactivar: colaborador é gestor imediato de colaboradores activos.",
    );
  }
}
