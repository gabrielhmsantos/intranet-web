import { cookies } from "next/headers";
import type { ProductRole } from "@/lib/roles";

export const DEV_AUTH_COOKIE = "dev_auth";
export const DEV_ROLE_COOKIE = "dev_role";

const VALID_ROLES: ProductRole[] = [
  "platform_admin",
  "tenant_admin",
  "hr",
  "manager",
  "employee",
];

export type DevSession = {
  isAuthenticated: boolean;
  role: ProductRole;
  tenantDisplayName: string;
};

export function normalizeDevRole(value: string | undefined | null): ProductRole {
  if (value && VALID_ROLES.includes(value as ProductRole)) {
    return value as ProductRole;
  }
  return "employee";
}

export async function getDevSession(): Promise<DevSession> {
  const cookieStore = await cookies();
  const authCookie = cookieStore.get(DEV_AUTH_COOKIE)?.value;
  const roleCookie = cookieStore.get(DEV_ROLE_COOKIE)?.value;
  const role = normalizeDevRole(roleCookie);

  // Stub EP-1: ler cookies de dev em qualquer ambiente (E2E com `pnpm start`).
  // Escrita de cookies continua restrita a development em setDevSession.
  if (authCookie === "1") {
    return {
      isAuthenticated: true,
      role,
      tenantDisplayName: "Empresa Alpha (demo)",
    };
  }

  return {
    isAuthenticated: false,
    role: "employee",
    tenantDisplayName:
      process.env.NODE_ENV === "development" ? "Empresa Alpha (demo)" : "Intranet",
  };
}

export async function getEffectiveTenantRole(): Promise<ProductRole> {
  const session = await getDevSession();
  if (session.role === "platform_admin") {
    return "employee";
  }
  if (process.env.NODE_ENV === "development" && !session.isAuthenticated) {
    return "employee";
  }
  return session.role;
}
