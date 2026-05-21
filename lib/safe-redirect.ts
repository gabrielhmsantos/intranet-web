import type { ProductRole } from "@/lib/roles";
import { isPlatformAdmin } from "@/lib/roles";

const TENANT_EXACT = [
  "/dashboard",
  "/perfil",
  "/organograma",
  "/notificacoes",
  "/colaboradores",
  "/eventos",
] as const;

const TENANT_PREFIXES = ["/colaboradores/", "/eventos/"] as const;

export function getDefaultRedirectForRole(role: ProductRole): string {
  if (isPlatformAdmin(role)) {
    return "/plataforma/dashboard";
  }
  return "/dashboard";
}

function isExternalOrProtocolRelative(path: string): boolean {
  return (
    path.includes("://") ||
    path.startsWith("//") ||
    path.startsWith("javascript:") ||
    path.startsWith("data:")
  );
}

function isTenantAllowlisted(path: string, role: ProductRole): boolean {
  if (path === "/configuracao") {
    return role === "tenant_admin";
  }

  if (TENANT_EXACT.includes(path as (typeof TENANT_EXACT)[number])) {
    return true;
  }

  return TENANT_PREFIXES.some((prefix) => path.startsWith(prefix));
}

function isPlatformAllowlisted(path: string): boolean {
  return path === "/plataforma/dashboard" || path.startsWith("/plataforma/");
}

export function safeRedirect(
  requested: string | null | undefined,
  role: ProductRole,
): string {
  if (!requested?.trim()) {
    return getDefaultRedirectForRole(role);
  }

  const path = requested.trim();

  if (!path.startsWith("/") || isExternalOrProtocolRelative(path)) {
    return getDefaultRedirectForRole(role);
  }

  if (isPlatformAdmin(role)) {
    if (isPlatformAllowlisted(path)) {
      return path;
    }
    return getDefaultRedirectForRole(role);
  }

  if (isTenantAllowlisted(path, role)) {
    return path;
  }

  return getDefaultRedirectForRole(role);
}
