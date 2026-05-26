import { describe, expect, it } from "vitest";
import { buildOrgChartTree } from "@/lib/org-chart/build-tree";

describe("buildOrgChartTree", () => {
  it("groups active members under departments", () => {
    const tree = buildOrgChartTree(
      [
        { id: "d1", name: "Engenharia", managerEmployeeId: "e1" },
        { id: "d2", name: "RH", managerEmployeeId: null },
      ],
      [
        { id: "e1", displayName: "Ana", departmentId: "d1", managerId: null },
        { id: "e2", displayName: "Bruno", departmentId: "d1", managerId: "e1" },
        { id: "e3", displayName: "Carla", departmentId: null, managerId: null },
      ],
    );

    expect(tree).toHaveLength(2);
    expect(tree[0].members).toHaveLength(2);
    expect(tree[0].members.map((m) => m.displayName)).toEqual(["Ana", "Bruno"]);
    expect(tree[1].members).toHaveLength(0);
  });
});
