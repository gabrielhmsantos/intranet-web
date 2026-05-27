import "server-only";

import { createAdminClient } from "@/lib/supabase/admin";
import {
  generateInviteToken,
  inviteExpiresAt,
  isInviteExpired,
} from "@/lib/invites";
import { normalizeEmail } from "@/lib/platform/email";

export class RenewBootstrapError extends Error {
  readonly status: number;

  constructor(message: string, status: number) {
    super(message);
    this.name = "RenewBootstrapError";
    this.status = status;
  }
}

export async function renewBootstrapInvite(
  inviteId: string,
  createdByUserId: string,
  origin: string,
): Promise<{ inviteUrl: string; expiresAt: string }> {
  const admin = createAdminClient();

  const { data: invite, error } = await admin
    .from("invite_tokens")
    .select("id, tenant_id, bootstrap_email, status, expires_at, kind")
    .eq("id", inviteId)
    .maybeSingle();

  if (error || !invite) {
    throw new RenewBootstrapError("Convite não encontrado.", 404);
  }

  if (invite.kind !== "bootstrap" || invite.status !== "pending") {
    throw new RenewBootstrapError("Convite não encontrado.", 404);
  }

  if (!isInviteExpired(invite.expires_at as string)) {
    throw new RenewBootstrapError(
      "Só pode renovar convites expirados.",
      409,
    );
  }

  const email = normalizeEmail((invite.bootstrap_email as string) ?? "");
  const tenantId = invite.tenant_id as string;

  await admin
    .from("invite_tokens")
    .update({ status: "revoked" })
    .eq("tenant_id", tenantId)
    .eq("kind", "bootstrap")
    .eq("bootstrap_email", email)
    .eq("status", "pending");

  const { raw, hash } = generateInviteToken();
  const expiresAt = inviteExpiresAt();

  const { error: insertError } = await admin.from("invite_tokens").insert({
    tenant_id: tenantId,
    kind: "bootstrap",
    employee_id: null,
    bootstrap_email: email,
    token_hash: hash,
    status: "pending",
    expires_at: expiresAt.toISOString(),
    created_by_user_id: createdByUserId,
  });

  if (insertError) {
    throw new Error(insertError.message);
  }

  return {
    inviteUrl: `${origin}/convite/${raw}`,
    expiresAt: expiresAt.toISOString(),
  };
}
