import type { ProductRole } from "@/lib/roles";
import type { EventDetail } from "@/lib/events/types";
import {
  canCancelEvent,
  canCreateEvents,
  canEditEvent,
  canMutateEvents,
  isLimitedAuthorEdit,
  type EventOwnershipContext,
} from "@/lib/events/roles";
import { hasManagerScope, type ManagerScope } from "@/lib/events/manager-scope";

export function ownershipContext(
  role: ProductRole,
  sessionEmployeeId: string | null,
  event: Pick<EventDetail, "status" | "createdByEmployeeId">,
): EventOwnershipContext {
  return {
    role,
    status: event.status,
    authorEmployeeId: event.createdByEmployeeId,
    sessionEmployeeId,
  };
}

export function canCreateEventsForSession(
  role: ProductRole,
  scope: ManagerScope | null,
): boolean {
  if (canMutateEvents(role)) {
    return true;
  }
  if (role === "manager" && scope) {
    return canCreateEvents(role, { hasManagerScope: hasManagerScope(scope) });
  }
  return false;
}

export { canEditEvent, canCancelEvent, canMutateEvents, isLimitedAuthorEdit };
