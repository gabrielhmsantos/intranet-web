import { createHash, randomBytes } from "node:crypto";

export const INVITE_TTL_DAYS = 7;

export const INVITE_INVALID_MESSAGE =
  "Este link não é válido ou já não está disponível. Contacte o RH ou a administração da sua empresa.";

export function generateInviteToken(): { raw: string; hash: string } {
  const raw = randomBytes(32).toString("base64url");
  return { raw, hash: hashInviteToken(raw) };
}

export function hashInviteToken(raw: string): string {
  return createHash("sha256").update(raw).digest("hex");
}

export function inviteExpiresAt(from: Date = new Date()): Date {
  const expires = new Date(from);
  expires.setDate(expires.getDate() + INVITE_TTL_DAYS);
  return expires;
}

export function isInviteExpired(expiresAt: string | Date): boolean {
  const expiry =
    typeof expiresAt === "string" ? new Date(expiresAt) : expiresAt;
  return expiry.getTime() <= Date.now();
}

export type InviteKind = "employee" | "bootstrap";

export type InviteRow = {
  id: string;
  tenant_id: string;
  kind: InviteKind;
  employee_id: string | null;
  bootstrap_email: string | null;
  token_hash: string;
  status: "pending" | "consumed" | "expired" | "revoked";
  expires_at: string;
  consumed_at: string | null;
};

export function isInviteTokenValid(row: InviteRow | null): boolean {
  if (!row) {
    return false;
  }
  if (row.status !== "pending") {
    return false;
  }
  return !isInviteExpired(row.expires_at);
}
