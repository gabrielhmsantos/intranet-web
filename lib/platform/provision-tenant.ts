import "server-only";

import { createAdminClient } from "@/lib/supabase/admin";
import {
  generateInviteToken,
  inviteExpiresAt,
} from "@/lib/invites";
import { isValidEmail, normalizeEmail } from "@/lib/platform/email";

export type ProvisionInput = {
  companyName: string;
  adminEmail: string;
  createdByUserId: string;
};

export type ProvisionResult = {
  tenantId: string;
  inviteUrl: string;
  expiresAt: string;
};

export class ProvisionValidationError extends Error {
  constructor(message: string) {
    super(message);
    this.name = "ProvisionValidationError";
  }
}

export class EmailAlreadyRegisteredError extends Error {
  constructor() {
    super("EMAIL_ALREADY_REGISTERED");
    this.name = "EmailAlreadyRegisteredError";
  }
}

export function validateProvisionInput(input: ProvisionInput): {
  companyName: string;
  adminEmail: string;
} {
  const companyName = input.companyName.trim();
  if (!companyName) {
    throw new ProvisionValidationError("Indique o nome da empresa.");
  }

  const adminEmail = normalizeEmail(input.adminEmail);
  if (!isValidEmail(adminEmail)) {
    throw new ProvisionValidationError("Indique um e-mail válido.");
  }

  return { companyName, adminEmail };
}

export async function authUserExistsByEmail(email: string): Promise<boolean> {
  const admin = createAdminClient();
  const normalized = normalizeEmail(email);
  const { data, error } = await admin.auth.admin.listUsers({
    page: 1,
    perPage: 1000,
  });

  if (error) {
    throw new Error(error.message);
  }

  return (data.users ?? []).some(
    (u) => u.email && normalizeEmail(u.email) === normalized,
  );
}

export async function provisionTenant(
  input: ProvisionInput,
  origin: string,
): Promise<ProvisionResult> {
  const { companyName, adminEmail } = validateProvisionInput(input);

  if (await authUserExistsByEmail(adminEmail)) {
    throw new EmailAlreadyRegisteredError();
  }

  const admin = createAdminClient();
  const { raw, hash } = generateInviteToken();
  const expiresAt = inviteExpiresAt();

  const { data: tenant, error: tenantError } = await admin
    .from("tenants")
    .insert({ name: companyName, kind: "client" })
    .select("id")
    .single();

  if (tenantError || !tenant) {
    throw new Error(tenantError?.message ?? "tenant insert failed");
  }

  const { error: inviteError } = await admin.from("invite_tokens").insert({
    tenant_id: tenant.id,
    kind: "bootstrap",
    employee_id: null,
    bootstrap_email: adminEmail,
    token_hash: hash,
    status: "pending",
    expires_at: expiresAt.toISOString(),
    created_by_user_id: input.createdByUserId,
  });

  if (inviteError) {
    throw new Error(inviteError.message);
  }

  return {
    tenantId: tenant.id as string,
    inviteUrl: `${origin}/convite/${raw}`,
    expiresAt: expiresAt.toISOString(),
  };
}
