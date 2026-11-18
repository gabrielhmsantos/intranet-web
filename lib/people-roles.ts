import type { ProductRole } from "@/lib/roles";

export function canListInactive(role: ProductRole): boolean {
  return role === "tenant_admin" || role === "hr";
}

export function canMutateEmployees(role: ProductRole): boolean {
  return role === "tenant_admin" || role === "hr";
}

export function canMutateDepartments(role: ProductRole): boolean {
  return role === "tenant_admin" || role === "hr";
}

/** Conta/convite na lista e secção Acesso na ficha — só RH e admin do tenant. */
export function canViewEmployeeAccess(role: ProductRole): boolean {
  return role === "tenant_admin" || role === "hr";
}
