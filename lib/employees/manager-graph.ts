export type ManagerEdge = { id: string; managerId: string | null };

export class ManagerGraphError extends Error {
  constructor(message: string) {
    super(message);
    this.name = "ManagerGraphError";
  }
}

/** Reject self-manager and cycles when assigning managerId for employeeId. */
export function assertValidManagerAssignment(
  employeeId: string,
  managerId: string | null,
  edges: ManagerEdge[],
): void {
  if (!managerId) {
    return;
  }

  if (managerId === employeeId) {
    throw new ManagerGraphError("O colaborador não pode ser gestor de si próprio.");
  }

  const byId = new Map(edges.map((e) => [e.id, e.managerId]));

  let current: string | null = managerId;
  const visited = new Set<string>();

  while (current) {
    if (current === employeeId) {
      throw new ManagerGraphError("A hierarquia de gestores formaria um ciclo.");
    }
    if (visited.has(current)) {
      throw new ManagerGraphError("A hierarquia de gestores formaria um ciclo.");
    }
    visited.add(current);
    current = byId.get(current) ?? null;
  }
}
