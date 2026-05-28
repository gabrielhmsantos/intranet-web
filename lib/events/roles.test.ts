import { describe, expect, it } from "vitest";
import {
  canCancelEvent,
  canCreateEvents,
  canEditEvent,
  canManagerEditLegacyEvent,
  canMutateEvents,
  isLimitedAuthorEdit,
} from "@/lib/events/roles";

const managerAuthor = {
  role: "manager" as const,
  status: "active" as const,
  authorEmployeeId: "c0000000-0000-4000-8000-000000000013",
  sessionEmployeeId: "c0000000-0000-4000-8000-000000000013",
};

describe("events roles", () => {
  it("allows mutate for tenant_admin and hr only", () => {
    expect(canMutateEvents("tenant_admin")).toBe(true);
    expect(canMutateEvents("hr")).toBe(true);
    expect(canMutateEvents("manager")).toBe(false);
    expect(canMutateEvents("employee")).toBe(false);
    expect(canMutateEvents("platform_admin")).toBe(false);
  });

  it("canCreateEvents: manager with scope; employee false", () => {
    expect(canCreateEvents("manager", { hasManagerScope: true })).toBe(true);
    expect(canCreateEvents("manager", { hasManagerScope: false })).toBe(false);
    expect(canCreateEvents("manager")).toBe(false);
    expect(canCreateEvents("employee")).toBe(false);
    expect(canCreateEvents("hr")).toBe(true);
  });

  it("canEdit and canCancel for mutators on active events only", () => {
    for (const role of ["manager", "employee"] as const) {
      expect(canEditEvent({ role, status: "active" })).toBe(false);
      expect(canCancelEvent({ role, status: "active" })).toBe(false);
      expect(canEditEvent({ role, status: "canceled" })).toBe(false);
      expect(canCancelEvent({ role, status: "canceled" })).toBe(false);
    }

    expect(canEditEvent({ role: "hr", status: "active" })).toBe(true);
    expect(canCancelEvent({ role: "hr", status: "active" })).toBe(true);
    expect(canEditEvent({ role: "hr", status: "canceled" })).toBe(false);
    expect(canCancelEvent({ role: "hr", status: "canceled" })).toBe(false);
  });

  it("manager edits own active events", () => {
    expect(canEditEvent(managerAuthor)).toBe(true);
    expect(canCancelEvent(managerAuthor)).toBe(true);
    expect(isLimitedAuthorEdit(managerAuthor)).toBe(false);
  });

  it("ex-manager author: edit/cancel own; limited fields", () => {
    const exManager = {
      role: "employee" as const,
      status: "active" as const,
      authorEmployeeId: "c0000000-0000-4000-8000-000000000013",
      sessionEmployeeId: "c0000000-0000-4000-8000-000000000013",
    };
    expect(canEditEvent(exManager)).toBe(true);
    expect(canCancelEvent(exManager)).toBe(true);
    expect(isLimitedAuthorEdit(exManager)).toBe(true);
  });

  it("legacy event (null author): manager cannot edit", () => {
    expect(
      canEditEvent({
        role: "manager",
        status: "active",
        authorEmployeeId: null,
        sessionEmployeeId: "c0000000-0000-4000-8000-000000000013",
      }),
    ).toBe(false);
    expect(canManagerEditLegacyEvent(managerAuthor)).toBe(false);
  });

  it("canceled own event: no edit/cancel", () => {
    expect(
      canEditEvent({
        ...managerAuthor,
        status: "canceled",
      }),
    ).toBe(false);
    expect(
      canCancelEvent({
        ...managerAuthor,
        status: "canceled",
      }),
    ).toBe(false);
  });
});
