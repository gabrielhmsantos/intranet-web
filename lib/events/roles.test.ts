import { describe, expect, it } from "vitest";
import { canCancelEvent, canEditEvent, canMutateEvents } from "@/lib/events/roles";

describe("events roles", () => {
  it("allows mutate for tenant_admin and hr only", () => {
    expect(canMutateEvents("tenant_admin")).toBe(true);
    expect(canMutateEvents("hr")).toBe(true);
    expect(canMutateEvents("manager")).toBe(false);
    expect(canMutateEvents("employee")).toBe(false);
    expect(canMutateEvents("platform_admin")).toBe(false);
  });

  it("canEdit and canCancel only for mutators on active events", () => {
    for (const role of ["manager", "employee"] as const) {
      expect(canEditEvent(role, "active")).toBe(false);
      expect(canCancelEvent(role, "active")).toBe(false);
      expect(canEditEvent(role, "canceled")).toBe(false);
      expect(canCancelEvent(role, "canceled")).toBe(false);
    }

    expect(canEditEvent("hr", "active")).toBe(true);
    expect(canCancelEvent("hr", "active")).toBe(true);
    expect(canEditEvent("hr", "canceled")).toBe(false);
    expect(canCancelEvent("hr", "canceled")).toBe(false);
  });
});
