import type { ServerSession } from "@/lib/session";
import type { DevSession } from "@/lib/dev-session";
import { isPlatformAdmin } from "@/lib/roles";

type SessionLike = Pick<
  DevSession | ServerSession,
  "isAuthenticated" | "role"
>;

export function getGatewayRedirect(session: SessionLike): string {
  if (!session.isAuthenticated) {
    return "/login";
  }
  if (isPlatformAdmin(session.role)) {
    return "/plataforma/dashboard";
  }
  return "/dashboard";
}

export function getAuthenticatedLoginRedirect(session: SessionLike): string {
  return getGatewayRedirect(session);
}
