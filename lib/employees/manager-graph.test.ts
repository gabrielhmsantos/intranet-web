import { describe, expect, it } from "vitest";
import {
  assertValidManagerAssignment,
  ManagerGraphError,
} from "@/lib/employees/manager-graph";

describe("assertValidManagerAssignment", () => {
  const edges = [
    { id: "a", managerId: "b" },
    { id: "b", managerId: "c" },
    { id: "c", managerId: null },
    { id: "d", managerId: null },
  ];

  it("rejects self-manager", () => {
    expect(() => assertValidManagerAssignment("a", "a", edges)).toThrow(
      ManagerGraphError,
    );
  });

  it("rejects cycle", () => {
    expect(() => assertValidManagerAssignment("c", "a", edges)).toThrow(
      ManagerGraphError,
    );
  });

  it("rejects assigning self as manager", () => {
    expect(() =>
      assertValidManagerAssignment("a", "a", [{ id: "a", managerId: null }]),
    ).toThrow(ManagerGraphError);
  });

  it("allows valid manager", () => {
    expect(() => assertValidManagerAssignment("d", "b", edges)).not.toThrow();
  });
});
