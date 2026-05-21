import type { DevSession } from "@/lib/dev-session";
import { isPlatformAdmin } from "@/lib/roles";

export function getGatewayRedirect(session: DevSession): string {
  if (!session.isAuthenticated) {
    return "/login";
  }
  if (isPlatformAdmin(session.role)) {
    return "/plataforma/dashboard";
  }
  return "/dashboard";
}

export function getAuthenticatedLoginRedirect(session: DevSession): string {
  return getGatewayRedirect(session);
}
