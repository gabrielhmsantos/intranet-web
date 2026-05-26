import { describe, expect, it } from "vitest";
import { employeeDetailPermissions } from "@/lib/employees/permissions";

describe("employeeDetailPermissions", () => {
  it("denies edit and invite for employee on active colleague", () => {
    expect(
      employeeDetailPermissions("employee", "active", true, true),
    ).toEqual({
      canEdit: false,
      canInvite: false,
      canDeactivate: false,
      canReactivate: false,
    });
  });

  it("denies edit and invite for manager on active colleague", () => {
    expect(
      employeeDetailPermissions("manager", "active", false, true),
    ).toEqual({
      canEdit: false,
      canInvite: false,
      canDeactivate: false,
      canReactivate: false,
    });
  });

  it("allows edit and invite for hr on active without account", () => {
    expect(
      employeeDetailPermissions("hr", "active", false, true),
    ).toEqual({
      canEdit: true,
      canInvite: true,
      canDeactivate: true,
      canReactivate: false,
    });
  });

  it("allows reactivate for tenant_admin on inactive", () => {
    expect(
      employeeDetailPermissions("tenant_admin", "inactive", false, true),
    ).toEqual({
      canEdit: false,
      canInvite: false,
      canDeactivate: false,
      canReactivate: true,
    });
  });
});
