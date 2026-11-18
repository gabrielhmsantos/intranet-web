import { z } from "zod";

export const employeeStatusSchema = z.enum(["active", "inactive"]);

export const listEmployeesQuerySchema = z.object({
  page: z.coerce.number().int().min(1).default(1),
  pageSize: z.coerce.number().int().min(1).max(50).default(20),
  q: z.string().trim().optional(),
  includeInactive: z.boolean().default(false),
});

export const createEmployeeBodySchema = z.object({
  displayName: z.string().trim().min(1, "Nome obrigatório."),
  workEmail: z
    .string()
    .trim()
    .email("E-mail inválido.")
    .optional()
    .or(z.literal("").transform(() => undefined)),
  departmentId: z.string().uuid().nullable().optional(),
  managerId: z.string().uuid().nullable().optional(),
  extensionNumber: z.string().trim().max(32).optional().or(z.literal("").transform(() => undefined)),
});

export const updateEmployeeBodySchema = createEmployeeBodySchema.partial();

export type ListEmployeesQuery = z.infer<typeof listEmployeesQuerySchema>;
export type CreateEmployeeBody = z.infer<typeof createEmployeeBodySchema>;
export type UpdateEmployeeBody = z.infer<typeof updateEmployeeBodySchema>;
