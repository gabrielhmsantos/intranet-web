import { describe, expect, it } from "vitest";
import {
  canListInactive,
  canMutateDepartments,
  canMutateEmployees,
  canViewEmployeeAccess,
} from "@/lib/people-roles";

describe("people-roles", () => {
  it("only tenant_admin and hr can list inactive", () => {
    expect(canListInactive("tenant_admin")).toBe(true);
    expect(canListInactive("hr")).toBe(true);
    expect(canListInactive("manager")).toBe(false);
    expect(canListInactive("employee")).toBe(false);
    expect(canListInactive("platform_admin")).toBe(false);
  });

  it("only tenant_admin and hr can mutate employees", () => {
    expect(canMutateEmployees("tenant_admin")).toBe(true);
    expect(canMutateEmployees("hr")).toBe(true);
    expect(canMutateEmployees("manager")).toBe(false);
    expect(canMutateEmployees("employee")).toBe(false);
  });

  it("only tenant_admin and hr can mutate departments", () => {
    expect(canMutateDepartments("tenant_admin")).toBe(true);
    expect(canMutateDepartments("hr")).toBe(true);
    expect(canMutateDepartments("manager")).toBe(false);
    expect(canMutateDepartments("employee")).toBe(false);
  });

  it("only tenant_admin and hr can view employee access info", () => {
    expect(canViewEmployeeAccess("tenant_admin")).toBe(true);
    expect(canViewEmployeeAccess("hr")).toBe(true);
    expect(canViewEmployeeAccess("manager")).toBe(false);
    expect(canViewEmployeeAccess("employee")).toBe(false);
  });
});
