import "server-only";

import { createAdminClient } from "@/lib/supabase/admin";
import { maskEmail } from "@/lib/email-mask";
import {
  hashInviteToken,
  inviteExpiresAt,
  isInviteTokenValid,
  type InviteRow,
} from "@/lib/invites";

export async function findInviteByRawToken(
  rawToken: string,
): Promise<InviteRow | null> {
  const admin = createAdminClient();
  const hash = hashInviteToken(rawToken);

  const { data, error } = await admin
    .from("invite_tokens")
    .select(
      "id, tenant_id, employee_id, token_hash, status, expires_at, consumed_at",
    )
    .eq("token_hash", hash)
    .maybeSingle();

  if (error || !data) {
    return null;
  }

  return data as InviteRow;
}

export async function validateInviteForDisplay(
  rawToken: string,
): Promise<{ valid: true; maskedEmail: string } | { valid: false }> {
  const invite = await findInviteByRawToken(rawToken);
  if (!isInviteTokenValid(invite)) {
    return { valid: false };
  }

  const admin = createAdminClient();
  const { data: employee } = await admin
    .from("employees")
    .select("work_email")
    .eq("id", invite!.employee_id)
    .maybeSingle();

  const email = employee?.work_email?.trim();
  if (!email) {
    return { valid: false };
  }

  return { valid: true, maskedEmail: maskEmail(email) };
}

export { isInviteTokenValid, inviteExpiresAt, hashInviteToken };
