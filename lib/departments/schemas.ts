import { z } from "zod";

export const departmentNameSchema = z
  .string()
  .trim()
  .min(1, "Nome do departamento obrigatório.")
  .max(120, "Nome demasiado longo.");

export const createDepartmentBodySchema = z.object({
  name: departmentNameSchema,
  managerEmployeeId: z.string().uuid().nullable().optional(),
});

export const updateDepartmentBodySchema = z.object({
  name: departmentNameSchema.optional(),
  managerEmployeeId: z.string().uuid().nullable().optional(),
});

export type CreateDepartmentBody = z.infer<typeof createDepartmentBodySchema>;
export type UpdateDepartmentBody = z.infer<typeof updateDepartmentBodySchema>;
