import type { ProductRole } from "@/lib/roles";
import { isPlatformAdmin } from "@/lib/roles";

export type RouteAccessResult =
  | { allowed: true }
  | { allowed: false; reason: "unauthenticated" | "forbidden" | "platform_redirect" };

export function canAccessPath(
  role: ProductRole,
  pathname: string,
  isAuthenticated: boolean,
): RouteAccessResult {
  if (!isAuthenticated) {
    return { allowed: false, reason: "unauthenticated" };
  }

  if (pathname.startsWith("/plataforma")) {
    if (!isPlatformAdmin(role)) {
      return { allowed: false, reason: "forbidden" };
    }
    return { allowed: true };
  }

  if (isPlatformAdmin(role)) {
    return { allowed: false, reason: "platform_redirect" };
  }

  if (pathname === "/configuracao" || pathname.startsWith("/configuracao/")) {
    if (role !== "tenant_admin") {
      return { allowed: false, reason: "forbidden" };
    }
  }

  if (pathname === "/eventos/novo" || pathname.startsWith("/eventos/novo/")) {
    if (role === "manager" || role === "employee") {
      return { allowed: false, reason: "forbidden" };
    }
  }

  return { allowed: true };
}

export function isTenantAreaPath(pathname: string): boolean {
  const tenantPrefixes = [
    "/dashboard",
    "/perfil",
    "/colaboradores",
    "/organograma",
    "/eventos",
    "/notificacoes",
    "/configuracao",
    "/dev",
    "/sem-permissao",
  ];
  return tenantPrefixes.some(
    (prefix) => pathname === prefix || pathname.startsWith(`${prefix}/`),
  );
}

export function isPlatformAreaPath(pathname: string): boolean {
  return pathname === "/plataforma" || pathname.startsWith("/plataforma/");
}

export function isPublicAuthPath(pathname: string): boolean {
  return pathname === "/login" || pathname.startsWith("/convite/");
}
