import { describe, expect, it, vi } from "vitest";
import {
  fetchUpcomingEvents,
  fetchWeekEvents,
  mergePendingInviteRows,
} from "@/lib/dashboard/queries";

function mockEventsChain(resolved: { data: unknown[]; error: null }) {
  const chain = {
    select: vi.fn().mockReturnThis(),
    eq: vi.fn().mockReturnThis(),
    gt: vi.fn().mockReturnThis(),
    gte: vi.fn().mockReturnThis(),
    lte: vi.fn().mockReturnThis(),
    order: vi.fn().mockReturnThis(),
    limit: vi.fn().mockResolvedValue(resolved),
  };
  return chain;
}

describe("fetchUpcomingEvents", () => {
  it("queries active future events ordered by starts_at", async () => {
    const chain = mockEventsChain({
      data: [
        {
          id: "1",
          title: "A",
          starts_at: "2026-12-01T10:00:00.000Z",
          ends_at: "2026-12-01T11:00:00.000Z",
          status: "active",
        },
      ],
      error: null,
    });
    const from = vi.fn(() => chain);

    const rows = await fetchUpcomingEvents({ from } as never, 5);

    expect(rows).toHaveLength(1);
    expect(chain.eq).toHaveBeenCalledWith("status", "active");
    expect(chain.gt).toHaveBeenCalledWith("starts_at", expect.any(String));
    expect(chain.order).toHaveBeenCalledWith("starts_at", { ascending: true });
    expect(chain.limit).toHaveBeenCalledWith(5);
  });
});

describe("fetchWeekEvents", () => {
  it("excludes canceled and bounds starts_at to civil week", async () => {
    const chain = mockEventsChain({ data: [], error: null });
    const from = vi.fn(() => chain);

    await fetchWeekEvents(
      { from } as never,
      "Europe/Lisbon",
      8,
      new Date("2026-05-27T12:00:00.000Z"),
    );

    expect(chain.eq).toHaveBeenCalledWith("status", "active");
    expect(chain.gte).toHaveBeenCalledWith("starts_at", expect.any(String));
    expect(chain.lte).toHaveBeenCalledWith("starts_at", expect.any(String));
    expect(chain.limit).toHaveBeenCalledWith(8);
  });
});

describe("mergePendingInviteRows", () => {
  it("labels pending invite over sem conta and truncates", () => {
    const pending = new Set(["e2"]);
    const result = mergePendingInviteRows(
      [
        { id: "e1", display_name: "Ana" },
        { id: "e2", display_name: "Bruno" },
        { id: "e3", display_name: "Carlos" },
      ],
      pending,
      2,
    );

    expect(result.totalCount).toBe(3);
    expect(result.items).toHaveLength(2);
    expect(result.items[1]?.label).toBe("Convite pendente");
    expect(result.items[0]?.label).toBe("Sem conta");
  });
});
