import type { ProductRole } from "@/lib/roles";

export type EventStatus = "active" | "canceled";

export type EventOwnershipContext = {
  role: ProductRole;
  status: EventStatus;
  authorEmployeeId?: string | null;
  sessionEmployeeId?: string | null;
};

function isEventAuthor(ctx: EventOwnershipContext): boolean {
  return Boolean(
    ctx.authorEmployeeId &&
      ctx.sessionEmployeeId &&
      ctx.authorEmployeeId === ctx.sessionEmployeeId,
  );
}

export function canMutateEvents(role: ProductRole): boolean {
  return role === "tenant_admin" || role === "hr";
}

export function canCreateEvents(
  role: ProductRole,
  options?: { hasManagerScope?: boolean },
): boolean {
  if (canMutateEvents(role)) {
    return true;
  }
  if (role === "manager") {
    return options?.hasManagerScope ?? false;
  }
  return false;
}

export function canEditEvent(ctx: EventOwnershipContext): boolean {
  if (ctx.status !== "active") {
    return false;
  }

  if (canMutateEvents(ctx.role)) {
    return true;
  }

  if (!isEventAuthor(ctx)) {
    return false;
  }

  if (ctx.role === "manager") {
    return true;
  }

  // Author without manager role: limited edit (title/description) — still shows Edit
  return Boolean(ctx.authorEmployeeId);
}

export function canCancelEvent(ctx: EventOwnershipContext): boolean {
  return canEditEvent(ctx);
}

/** Ex-author (not manager/admin/hr) may only patch title and description. */
export function isLimitedAuthorEdit(ctx: EventOwnershipContext): boolean {
  if (ctx.status !== "active" || !isEventAuthor(ctx)) {
    return false;
  }
  return ctx.role !== "manager" && !canMutateEvents(ctx.role);
}

export function canManagerEditLegacyEvent(ctx: EventOwnershipContext): boolean {
  if (ctx.role !== "manager" || ctx.status !== "active") {
    return false;
  }
  if (!isEventAuthor(ctx)) {
    return false;
  }
  return ctx.authorEmployeeId == null;
}
