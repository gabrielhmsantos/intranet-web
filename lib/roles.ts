export type ProductRole =
  | "platform_admin"
  | "tenant_admin"
  | "hr"
  | "manager"
  | "employee";

export type MenuItemId =
  | "dashboard"
  | "colaboradores"
  | "organograma"
  | "eventos"
  | "notificacoes"
  | "configuracao";

const TENANT_MENU_ROLES: ProductRole[] = [
  "tenant_admin",
  "hr",
  "manager",
  "employee",
];

const MENU_VISIBILITY: Record<MenuItemId, ProductRole[]> = {
  dashboard: TENANT_MENU_ROLES,
  colaboradores: TENANT_MENU_ROLES,
  organograma: TENANT_MENU_ROLES,
  eventos: TENANT_MENU_ROLES,
  notificacoes: TENANT_MENU_ROLES,
  configuracao: ["tenant_admin"],
};

const CREATE_ROLES: ProductRole[] = ["tenant_admin", "hr", "manager"];

export function canSeeMenuItem(role: ProductRole, item: MenuItemId): boolean {
  return MENU_VISIBILITY[item].includes(role);
}

export function canCreate(role: ProductRole): boolean {
  return CREATE_ROLES.includes(role);
}

export function isPlatformAdmin(role: ProductRole): boolean {
  return role === "platform_admin";
}

export function isTenantRole(role: ProductRole): boolean {
  return role !== "platform_admin";
}
