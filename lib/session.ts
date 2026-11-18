import { getDevSession, normalizeDevRole } from "@/lib/dev-session";
import { resolveDisplayName } from "@/lib/profile/display-name";
import { isSupabaseConfigured } from "@/lib/supabase/env";
import { createClient } from "@/lib/supabase/server";
import type { ProductRole } from "@/lib/roles";
import { isPlatformAdmin } from "@/lib/roles";

export type ServerSession = {
  isAuthenticated: boolean;
  userId: string | null;
  email: string | null;
  displayName: string;
  tenantId: string | null;
  tenantName: string;
  role: ProductRole;
  employeeId: string | null;
  isPlatformAdmin: boolean;
  source: "supabase" | "dev";
};

/** Seed Alpha employee ids for dev_auth E2E (EP-9). */
const DEV_EMPLOYEE_BY_ROLE: Partial<Record<ProductRole, string>> = {
  hr: "c0000000-0000-4000-8000-000000000011",
  employee: "c0000000-0000-4000-8000-000000000012",
  manager: "c0000000-0000-4000-8000-000000000013",
};

const UNAUTHENTICATED: ServerSession = {
  isAuthenticated: false,
  userId: null,
  email: null,
  displayName: "Utilizador",
  tenantId: null,
  tenantName: "Intranet",
  role: "employee",
  employeeId: null,
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
      displayName: dev.tenantDisplayName,
      tenantId: null,
      tenantName: dev.tenantDisplayName,
      role: dev.role,
      employeeId: DEV_EMPLOYEE_BY_ROLE[dev.role] ?? null,
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

  const { data: employee } = await supabase
    .from("employees")
    .select("id, display_name")
    .eq("user_id", user.id)
    .maybeSingle();

  const displayName = resolveDisplayName(
    user.user_metadata as Record<string, unknown> | undefined,
    employee?.display_name ?? null,
    user.email ?? null,
  );

  return {
    isAuthenticated: true,
    userId: user.id,
    email: user.email ?? null,
    displayName,
    tenantId: membership.tenant_id,
    tenantName: tenant?.name ?? "Intranet",
    role,
    employeeId: (employee?.id as string | undefined) ?? null,
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
