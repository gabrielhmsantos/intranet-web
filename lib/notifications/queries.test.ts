import { describe, expect, it, vi } from "vitest";
import {
  countUnread,
  markAllRead,
  previewNotifications,
} from "@/lib/notifications/queries";

function mockSupabase() {
  const chain = {
    select: vi.fn().mockReturnThis(),
    gte: vi.fn().mockReturnThis(),
    order: vi.fn().mockReturnThis(),
    limit: vi.fn().mockReturnThis(),
    is: vi.fn().mockReturnThis(),
    update: vi.fn().mockReturnThis(),
  };

  const from = vi.fn(() => chain);
  return { from, chain };
}

describe("previewNotifications", () => {
  it("limits to 8 items with 90-day cutoff", async () => {
    const { from, chain } = mockSupabase();
    chain.limit.mockResolvedValue({ data: [], error: null });

    await previewNotifications({ from } as never, "Europe/Lisbon");

    expect(chain.gte).toHaveBeenCalledWith(
      "created_at",
      expect.stringMatching(/^\d{4}-\d{2}-\d{2}T/),
    );
    expect(chain.limit).toHaveBeenCalledWith(8);
  });
});

describe("countUnread", () => {
  it("counts only unread within cutoff window", async () => {
    const { from, chain } = mockSupabase();
    chain.is.mockResolvedValue({ count: 3, error: null });

    const count = await countUnread({ from } as never, "Europe/Lisbon");

    expect(count).toBe(3);
    expect(chain.is).toHaveBeenCalledWith("read_at", null);
    expect(chain.gte).toHaveBeenCalled();
  });
});

describe("markAllRead", () => {
  it("updates only rows with read_at null", async () => {
    const { from, chain } = mockSupabase();
    chain.gte.mockResolvedValue({ error: null });

    await markAllRead({ from } as never, "Europe/Lisbon");

    expect(chain.is).toHaveBeenCalledWith("read_at", null);
    expect(chain.update).toHaveBeenCalledWith({
      read_at: expect.any(String),
    });
  });
});
