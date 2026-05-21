import { getDevSession, normalizeDevRole } from "@/lib/dev-session";
import { isSupabaseConfigured } from "@/lib/supabase/env";
import { createClient } from "@/lib/supabase/server";
import type { ProductRole } from "@/lib/roles";
import { isPlatformAdmin } from "@/lib/roles";

export type ServerSession = {
  isAuthenticated: boolean;
  userId: string | null;
  email: string | null;
  tenantId: string | null;
  tenantName: string;
  role: ProductRole;
  isPlatformAdmin: boolean;
  source: "supabase" | "dev";
};

const UNAUTHENTICATED: ServerSession = {
  isAuthenticated: false,
  userId: null,
  email: null,
  tenantId: null,
  tenantName: "Intranet",
  role: "employee",
  isPlatformAdmin: false,
  source: "dev",
};

export async function getServerSession(): Promise<ServerSession> {
  if (!isSupabaseConfigured()) {
    const dev = await getDevSession();
    return {
      isAuthenticated: dev.isAuthenticated,
      userId: null,
      email: null,
      tenantId: null,
      tenantName: dev.tenantDisplayName,
      role: dev.role,
      isPlatformAdmin: isPlatformAdmin(dev.role),
      source: "dev",
    };
  }

  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return { ...UNAUTHENTICATED, source: "supabase" };
  }

  const { data: membership } = await supabase
    .from("tenant_memberships")
    .select("tenant_id, role, tenants(name, kind)")
    .eq("user_id", user.id)
    .maybeSingle();

  if (!membership) {
    return { ...UNAUTHENTICATED, source: "supabase" };
  }

  const tenants = membership.tenants as
    | { name: string; kind: string }
    | { name: string; kind: string }[]
    | null;
  const tenant = Array.isArray(tenants) ? tenants[0] : tenants;
  const role = normalizeDevRole(membership.role as string);

  return {
    isAuthenticated: true,
    userId: user.id,
    email: user.email ?? null,
    tenantId: membership.tenant_id,
    tenantName: tenant?.name ?? "Intranet",
    role,
    isPlatformAdmin: role === "platform_admin",
    source: "supabase",
  };
}

export async function validateTenantLogin(userId: string): Promise<boolean> {
  if (!isSupabaseConfigured()) {
    return true;
  }

  const supabase = await createClient();
  const { data: membership } = await supabase
    .from("tenant_memberships")
    .select("role, tenant_id, tenants(kind)")
    .eq("user_id", userId)
    .maybeSingle();

  if (!membership) {
    return false;
  }

  const tenants = membership.tenants as { kind: string } | { kind: string }[] | null;
  const tenant = Array.isArray(tenants) ? tenants[0] : tenants;

  if (tenant?.kind === "platform") {
    return true;
  }

  if (membership.role === "employee") {
    const { data: employee } = await supabase
      .from("employees")
      .select("id")
      .eq("tenant_id", membership.tenant_id)
      .eq("user_id", userId)
      .maybeSingle();
    return Boolean(employee);
  }

  return true;
}
