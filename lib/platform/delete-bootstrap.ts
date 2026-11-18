import "server-only";

import { createAdminClient } from "@/lib/supabase/admin";
import { isInviteExpired } from "@/lib/invites";
import { normalizeEmail } from "@/lib/platform/email";

export class DeleteBootstrapError extends Error {
  readonly status: number;

  constructor(message: string, status: number) {
    super(message);
    this.name = "DeleteBootstrapError";
    this.status = status;
  }
}

/** FR-019: tenant orphan check before Auth delete. */
export async function canDeleteBootstrapOrphan(
  tenantId: string,
): Promise<boolean> {
  const admin = createAdminClient();

  const { count: withAccount } = await admin
    .from("employees")
    .select("id", { count: "exact", head: true })
    .eq("tenant_id", tenantId)
    .not("user_id", "is", null);

  if ((withAccount ?? 0) > 0) {
    return false;
  }

  const { count: memberships } = await admin
    .from("tenant_memberships")
    .select("user_id", { count: "exact", head: true })
    .eq("tenant_id", tenantId);

  return (memberships ?? 0) <= 1;
}

export async function deleteBootstrapInvite(inviteId: string): Promise<void> {
  const admin = createAdminClient();

  const { data: invite, error } = await admin
    .from("invite_tokens")
    .select("id, tenant_id, bootstrap_email, status, expires_at, kind")
    .eq("id", inviteId)
    .maybeSingle();

  if (error || !invite) {
    throw new DeleteBootstrapError("Convite não encontrado.", 404);
  }

  if (
    invite.kind !== "bootstrap" ||
    invite.status !== "pending" ||
    !isInviteExpired(invite.expires_at as string)
  ) {
    throw new DeleteBootstrapError("Convite não encontrado.", 404);
  }

  const tenantId = invite.tenant_id as string;
  const email = normalizeEmail((invite.bootstrap_email as string) ?? "");

  const eligible = await canDeleteBootstrapOrphan(tenantId);
  if (!eligible) {
    throw new DeleteBootstrapError(
      "Não é possível excluir: a empresa já está em utilização.",
      409,
    );
  }

  await admin
    .from("invite_tokens")
    .update({ status: "revoked" })
    .eq("tenant_id", tenantId)
    .eq("kind", "bootstrap")
    .eq("bootstrap_email", email)
    .in("status", ["pending", "expired"]);

  const { data: users } = await admin.auth.admin.listUsers({
    page: 1,
    perPage: 1000,
  });

  const user = (users?.users ?? []).find(
    (u) => u.email && normalizeEmail(u.email) === email,
  );

  if (user) {
    const { data: memberships } = await admin
      .from("tenant_memberships")
      .select("tenant_id, role")
      .eq("user_id", user.id);

    const onTenant = (memberships ?? []).filter((m) => m.tenant_id === tenantId);
    const onlyTenantAdmin =
      onTenant.length === 1 && onTenant[0]?.role === "tenant_admin";
    const noOtherMemberships = (memberships ?? []).length <= 1;

    if (!onlyTenantAdmin || !noOtherMemberships) {
      throw new DeleteBootstrapError(
        "Não é possível excluir: a conta já está em utilização.",
        409,
      );
    }

    await admin
      .from("tenant_memberships")
      .delete()
      .eq("user_id", user.id)
      .eq("tenant_id", tenantId);

    await admin.auth.admin.deleteUser(user.id);
  }
}
