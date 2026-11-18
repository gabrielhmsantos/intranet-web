import { describe, expect, it } from "vitest";
import {
  FORBIDDEN_SUMMARY_KEYS,
  type TenantSummaryRow,
} from "@/lib/platform/tenant-summary-types";

describe("tenant summary contract", () => {
  const sample: TenantSummaryRow = {
    tenantId: "a0000000-0000-4000-8000-000000000010",
    tenantName: "Alpha",
    activeEmployees: 5,
    activeEvents: 2,
    pendingInvites: 1,
  };

  it("does not include forbidden PII keys", () => {
    const keys = Object.keys(sample);
    for (const forbidden of FORBIDDEN_SUMMARY_KEYS) {
      expect(keys).not.toContain(forbidden);
    }
  });
});
