import { describe, expect, it } from "vitest";
import { listEmployeesQuerySchema } from "@/lib/employees/schemas";

describe("listEmployeesQuerySchema", () => {
  it("defaults includeInactive to false", () => {
    const parsed = listEmployeesQuerySchema.parse({});
    expect(parsed.includeInactive).toBe(false);
  });

  it("parses includeInactive true when set", () => {
    const parsed = listEmployeesQuerySchema.parse({ includeInactive: true });
    expect(parsed.includeInactive).toBe(true);
  });
});
