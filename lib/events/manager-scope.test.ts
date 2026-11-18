import { describe, expect, it } from "vitest";
import { assertAudienceAllowed } from "@/lib/events/manager-scope";
import type { ManagerScope } from "@/lib/events/manager-scope";

const scope: ManagerScope = {
  employeeId: "c0000000-0000-4000-8000-000000000013",
  managedDepartments: [
    { id: "d0000000-0000-4000-8000-000000000010", name: "Engenharia" },
  ],
  scopedEmployees: [
    {
      id: "c0000000-0000-4000-8000-000000000012",
      fullName: "Alpha Staff One",
      departmentId: "d0000000-0000-4000-8000-000000000010",
    },
  ],
};

describe("assertAudienceAllowed", () => {
  it("rejects company audience", () => {
    expect(() =>
      assertAudienceAllowed(scope, {
        type: "company",
      }),
    ).toThrow(/empresa/i);
  });

  it("rejects department not managed", () => {
    expect(() =>
      assertAudienceAllowed(scope, {
        type: "department",
        departmentId: "d0000000-0000-4000-8000-000000000011",
      }),
    ).toThrow();
  });

  it("rejects employee out of scope", () => {
    expect(() =>
      assertAudienceAllowed(scope, {
        type: "employees",
        employeeIds: ["c0000000-0000-4000-8000-000000000011"],
      }),
    ).toThrow();
  });

  it("accepts managed department", () => {
    expect(() =>
      assertAudienceAllowed(scope, {
        type: "department",
        departmentId: "d0000000-0000-4000-8000-000000000010",
      }),
    ).not.toThrow();
  });

  it("accepts scoped employee (direct report)", () => {
    expect(() =>
      assertAudienceAllowed(scope, {
        type: "employees",
        employeeIds: ["c0000000-0000-4000-8000-000000000012"],
      }),
    ).not.toThrow();
  });
});
