import { z } from "zod";

export const MAX_SELECTED_EMPLOYEES = 50;

export const eventStatusSchema = z.enum(["active", "canceled"]);

export const eventAudienceTypeSchema = z.enum(["company", "department", "employees"]);

export const eventAudienceSchema = z
  .object({
    type: eventAudienceTypeSchema,
    departmentId: z.string().uuid().optional().nullable(),
    employeeIds: z.array(z.string().uuid()).optional(),
  })
  .superRefine((value, ctx) => {
    if (value.type === "department" && !value.departmentId) {
      ctx.addIssue({
        code: "custom",
        message: "Seleccione um departamento.",
        path: ["departmentId"],
      });
    }
    if (value.type === "employees") {
      const ids = value.employeeIds ?? [];
      if (ids.length < 1) {
        ctx.addIssue({
          code: "custom",
          message: "Seleccione pelo menos um colaborador.",
          path: ["employeeIds"],
        });
      }
      if (ids.length > MAX_SELECTED_EMPLOYEES) {
        ctx.addIssue({
          code: "custom",
          message: "Máximo de 50 colaboradores por evento.",
          path: ["employeeIds"],
        });
      }
    }
  });

export const listEventsQuerySchema = z.object({
  page: z.coerce.number().int().min(1).default(1),
  pageSize: z.coerce.number().int().min(1).max(100).default(20),
  from: z.string().trim().optional(),
  to: z.string().trim().optional(),
  status: eventStatusSchema.optional(),
  q: z.string().trim().optional(),
});

const eventBodyFieldsSchema = z.object({
  title: z.string().trim().min(1, "Título obrigatório."),
  startsAt: z.string().trim().min(1, "Data de início obrigatória."),
  endsAt: z.string().trim().min(1, "Data de fim obrigatória."),
  description: z
    .string()
    .trim()
    .optional()
    .or(z.literal("").transform(() => undefined)),
  location: z
    .string()
    .trim()
    .optional()
    .or(z.literal("").transform(() => undefined)),
  audience: eventAudienceSchema,
});

function refineEventDates(
  value: { startsAt?: string; endsAt?: string },
  ctx: z.RefinementCtx,
) {
  if (!value.startsAt || !value.endsAt) return;
  const start = Date.parse(value.startsAt);
  const end = Date.parse(value.endsAt);
  if (Number.isNaN(start) || Number.isNaN(end)) return;
  if (end < start) {
    ctx.addIssue({
      code: "custom",
      message: "A data de fim não pode ser anterior à de início.",
      path: ["endsAt"],
    });
  }
}

export const createEventBodySchema = eventBodyFieldsSchema.superRefine(refineEventDates);

export const updateEventBodySchema = eventBodyFieldsSchema
  .partial()
  .superRefine(refineEventDates);

export type ListEventsQuery = z.infer<typeof listEventsQuerySchema>;
export type CreateEventBody = z.infer<typeof createEventBodySchema>;
export type UpdateEventBody = z.infer<typeof updateEventBodySchema>;
