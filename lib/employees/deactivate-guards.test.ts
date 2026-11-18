import { describe, expect, it } from "vitest";
import {
  assertCanDeactivate,
  DeactivateBlockedError,
} from "@/lib/employees/deactivate-guards";

describe("assertCanDeactivate", () => {
  const base = { employeeId: "e1" };

  it("blocks when department manager", () => {
    expect(() =>
      assertCanDeactivate({
        ...base,
        managedDepartmentIds: ["d1"],
        activeDirectReportIds: [],
      }),
    ).toThrow(DeactivateBlockedError);
  });

  it("blocks when manager of active reports", () => {
    expect(() =>
      assertCanDeactivate({
        ...base,
        managedDepartmentIds: [],
        activeDirectReportIds: ["e2"],
      }),
    ).toThrow(DeactivateBlockedError);
  });

  it("allows when no blockers", () => {
    expect(() =>
      assertCanDeactivate({
        ...base,
        managedDepartmentIds: [],
        activeDirectReportIds: [],
      }),
    ).not.toThrow();
  });
});
