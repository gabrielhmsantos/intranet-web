import { describe, expect, it, vi } from "vitest";
import { listEvents } from "@/lib/events/repository";

describe("listEvents", () => {
  it("applies q filter and pagination", async () => {
    const range = vi.fn().mockResolvedValue({
      data: [
        {
          id: "e1",
          title: "Reunião",
          starts_at: "2026-06-01T10:00:00Z",
          ends_at: "2026-06-01T11:00:00Z",
          status: "active",
        },
      ],
      error: null,
      count: 1,
    });

    const chain = {
      eq: vi.fn().mockReturnThis(),
      gte: vi.fn().mockReturnThis(),
      lte: vi.fn().mockReturnThis(),
      ilike: vi.fn().mockReturnThis(),
      order: vi.fn().mockReturnThis(),
      select: vi.fn().mockReturnThis(),
      range,
    };

    const supabase = {
      from: vi.fn().mockReturnValue(chain),
    } as never;

    const result = await listEvents(supabase, "tenant-1", {
      page: 1,
      pageSize: 20,
      q: "reuni",
    });

    expect(chain.ilike).toHaveBeenCalledWith("title", "%reuni%");
    expect(result.items).toHaveLength(1);
    expect(result.items[0].title).toBe("Reunião");
  });
});
