import "server-only";

import { createAdminClient } from "@/lib/supabase/admin";
import { maskEmail } from "@/lib/email-mask";
import {
  hashInviteToken,
  inviteExpiresAt,
  isInviteExpired,
  isInviteTokenValid,
  type InviteRow,
} from "@/lib/invites";

const INVITE_SELECT =
  "id, tenant_id, kind, employee_id, bootstrap_email, token_hash, status, expires_at, consumed_at";

export async function findInviteByRawToken(
  rawToken: string,
): Promise<InviteRow | null> {
  const admin = createAdminClient();
  const hash = hashInviteToken(rawToken);

  const { data, error } = await admin
    .from("invite_tokens")
    .select(INVITE_SELECT)
    .eq("token_hash", hash)
    .maybeSingle();

  if (error || !data) {
    return null;
  }

  return data as InviteRow;
}

export async function findBootstrapByRawToken(
  rawToken: string,
): Promise<InviteRow | null> {
  const row = await findInviteByRawToken(rawToken);
  if (!row || row.kind !== "bootstrap") {
    return null;
  }
  return row;
}

export async function validateInviteForDisplay(
  rawToken: string,
): Promise<{ valid: true; maskedEmail: string } | { valid: false }> {
  const invite = await findInviteByRawToken(rawToken);
  if (!isInviteTokenValid(invite)) {
    return { valid: false };
  }

  if (invite!.kind === "bootstrap") {
    const email = invite!.bootstrap_email?.trim();
    if (!email) {
      return { valid: false };
    }
    return { valid: true, maskedEmail: maskEmail(email) };
  }

  const admin = createAdminClient();
  const { data: employee } = await admin
    .from("employees")
    .select("work_email")
    .eq("id", invite!.employee_id!)
    .maybeSingle();

  const email = employee?.work_email?.trim();
  if (!email) {
    return { valid: false };
  }

  return { valid: true, maskedEmail: maskEmail(email) };
}

export function isBootstrapInviteExpired(row: InviteRow): boolean {
  return row.status === "pending" && isInviteExpired(row.expires_at);
}

export { isInviteTokenValid, inviteExpiresAt, hashInviteToken };
