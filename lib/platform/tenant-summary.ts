import "server-only";

import { createAdminClient } from "@/lib/supabase/admin";
import { isInviteExpired } from "@/lib/invites";
import { countPendingInvites } from "@/lib/platform/pending-invites-count";
import type {
  TenantSummaryResponse,
  TenantSummaryRow,
} from "@/lib/platform/tenant-summary-types";

export type { TenantSummaryRow, TenantSummaryResponse };

export async function fetchTenantSummaries(): Promise<TenantSummaryResponse> {
  const admin = createAdminClient();

  const { data: tenants, error: tenantsError } = await admin
    .from("tenants")
    .select("id, name")
    .eq("kind", "client")
    .order("name", { ascending: true });

  if (tenantsError) {
    throw new Error(tenantsError.message);
  }

  const clientTenants = tenants ?? [];
  if (clientTenants.length === 0) {
    return { tenants: [] };
  }

  const tenantIds = clientTenants.map((t) => t.id as string);

  const [employeesRes, eventsRes, invitesRes] = await Promise.all([
    admin
      .from("employees")
      .select("tenant_id, id, user_id, status")
      .in("tenant_id", tenantIds)
      .eq("status", "active"),
    admin
      .from("events")
      .select("tenant_id")
      .in("tenant_id", tenantIds)
      .eq("status", "active"),
    admin
      .from("invite_tokens")
      .select("tenant_id, employee_id, status, expires_at, kind")
      .in("tenant_id", tenantIds)
      .eq("kind", "employee")
      .eq("status", "pending"),
  ]);

  if (employeesRes.error || eventsRes.error || invitesRes.error) {
    throw new Error(
      employeesRes.error?.message ??
        eventsRes.error?.message ??
        invitesRes.error?.message ??
        "aggregation failed",
    );
  }

  const activeEmployeeCount = new Map<string, number>();
  const withoutAccountByTenant = new Map<string, string[]>();
  const pendingInviteByTenant = new Map<string, string[]>();

  for (const emp of employeesRes.data ?? []) {
    const tid = emp.tenant_id as string;
    activeEmployeeCount.set(tid, (activeEmployeeCount.get(tid) ?? 0) + 1);
    if (!emp.user_id) {
      const list = withoutAccountByTenant.get(tid) ?? [];
      list.push(emp.id as string);
      withoutAccountByTenant.set(tid, list);
    }
  }

  const activeEventCount = new Map<string, number>();
  for (const ev of eventsRes.data ?? []) {
    const tid = ev.tenant_id as string;
    activeEventCount.set(tid, (activeEventCount.get(tid) ?? 0) + 1);
  }

  for (const inv of invitesRes.data ?? []) {
    if (isInviteExpired(inv.expires_at as string)) {
      continue;
    }
    const tid = inv.tenant_id as string;
    const eid = inv.employee_id as string;
    const list = pendingInviteByTenant.get(tid) ?? [];
    list.push(eid);
    pendingInviteByTenant.set(tid, list);
  }

  const summaries: TenantSummaryRow[] = clientTenants.map((t) => {
    const tid = t.id as string;
    return {
      tenantId: tid,
      tenantName: t.name as string,
      activeEmployees: activeEmployeeCount.get(tid) ?? 0,
      activeEvents: activeEventCount.get(tid) ?? 0,
      pendingInvites: countPendingInvites(
        withoutAccountByTenant.get(tid) ?? [],
        pendingInviteByTenant.get(tid) ?? [],
      ),
    };
  });

  return { tenants: summaries };
}
