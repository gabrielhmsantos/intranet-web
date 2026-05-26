import type { ProductRole } from "@/lib/roles";

export type EventStatus = "active" | "canceled";

export function canMutateEvents(role: ProductRole): boolean {
  return role === "tenant_admin" || role === "hr";
}

export function canEditEvent(role: ProductRole, status: EventStatus): boolean {
  return canMutateEvents(role) && status === "active";
}

export function canCancelEvent(role: ProductRole, status: EventStatus): boolean {
  return canMutateEvents(role) && status === "active";
}
