import "server-only";

import { createAdminClient } from "@/lib/supabase/admin";
import { isInviteExpired } from "@/lib/invites";

import type { ExpiredBootstrapInvite } from "@/lib/platform/expired-invites-types";

export type { ExpiredBootstrapInvite };

export async function fetchExpiredBootstrapInvites(): Promise<
  ExpiredBootstrapInvite[]
> {
  const admin = createAdminClient();

  const { data, error } = await admin
    .from("invite_tokens")
    .select(
      "id, tenant_id, bootstrap_email, expires_at, status, tenants(name)",
    )
    .eq("kind", "bootstrap")
    .eq("status", "pending")
    .order("expires_at", { ascending: false });

  if (error) {
    throw new Error(error.message);
  }

  const rows: ExpiredBootstrapInvite[] = [];

  for (const row of data ?? []) {
    if (!isInviteExpired(row.expires_at as string)) {
      continue;
    }
    const tenants = row.tenants as { name: string } | { name: string }[] | null;
    const tenant = Array.isArray(tenants) ? tenants[0] : tenants;
    const email = (row.bootstrap_email as string)?.trim();
    if (!email) {
      continue;
    }
    rows.push({
      inviteId: row.id as string,
      tenantId: row.tenant_id as string,
      tenantName: tenant?.name ?? "—",
      email,
      expiresAt: row.expires_at as string,
      status: "pending",
    });
  }

  return rows;
}
