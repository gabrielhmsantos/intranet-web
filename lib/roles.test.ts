import { describe, expect, it } from "vitest";
import { canCreate, canSeeMenuItem } from "@/lib/roles";
import { normalizeDevRole } from "@/lib/dev-session";

describe("canSeeMenuItem", () => {
  it("hides configuracao for hr, manager, employee", () => {
    for (const role of ["hr", "manager", "employee"] as const) {
      expect(canSeeMenuItem(role, "configuracao")).toBe(false);
      expect(canSeeMenuItem(role, "dashboard")).toBe(true);
    }
  });

  it("shows configuracao for tenant_admin", () => {
    expect(canSeeMenuItem("tenant_admin", "configuracao")).toBe(true);
  });
});

describe("canCreate", () => {
  it("allows tenant_admin, hr, manager", () => {
    expect(canCreate("tenant_admin")).toBe(true);
    expect(canCreate("hr")).toBe(true);
    expect(canCreate("manager")).toBe(true);
    expect(canCreate("employee")).toBe(false);
  });
});

describe("normalizeDevRole", () => {
  it("maps invalid values to employee", () => {
    expect(normalizeDevRole("invalid")).toBe("employee");
    expect(normalizeDevRole(undefined)).toBe("employee");
  });
});
