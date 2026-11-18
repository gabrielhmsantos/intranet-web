export type TenantSummaryRow = {
  tenantId: string;
  tenantName: string;
  activeEmployees: number;
  activeEvents: number;
  pendingInvites: number;
};

export type TenantSummaryResponse = {
  tenants: TenantSummaryRow[];
};

/** Keys that must never appear in dashboard API responses (FR-005). */
export const FORBIDDEN_SUMMARY_KEYS = [
  "email",
  "displayName",
  "title",
  "work_email",
  "body",
] as const;
