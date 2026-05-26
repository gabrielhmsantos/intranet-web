import type { EventAudience } from "@/lib/events/types";

export function audienceLabel(audience: EventAudience): string {
  switch (audience.type) {
    case "company":
      return "Toda a empresa";
    case "department":
      return audience.departmentName
        ? `Departamento: ${audience.departmentName}`
        : "Departamento";
    case "employees":
      return audience.employeeNames?.length
        ? `Colaboradores (${audience.employeeNames.length})`
        : "Colaboradores seleccionados";
    default:
      return "";
  }
}
