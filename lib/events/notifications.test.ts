import { describe, expect, it, vi } from "vitest";
import { insertImmediateForRecipients } from "@/lib/events/notifications";

describe("insertImmediateForRecipients", () => {
  it("inserts one row per recipient with mapped user ids", async () => {
    const insert = vi.fn().mockResolvedValue({ error: null });
    const admin = {
      from: () => ({ insert }),
    } as never;

    await insertImmediateForRecipients(admin, {
      tenantId: "t1",
      eventId: "e1",
      kind: "event_canceled",
      eventTitle: "Town hall",
      startsAt: "2026-06-01T10:00:00.000Z",
      endsAt: "2026-06-01T11:00:00.000Z",
      timeZone: "Europe/Lisbon",
      recipientUserIds: ["u1", "u2"],
    });

    expect(insert).toHaveBeenCalledOnce();
    const rows = insert.mock.calls[0][0] as { recipient_user_id: string; kind: string }[];
    expect(rows).toHaveLength(2);
    expect(rows.map((r) => r.recipient_user_id)).toEqual(["u1", "u2"]);
    expect(rows[0].kind).toBe("event_canceled");
  });

  it("skips insert when no recipients", async () => {
    const insert = vi.fn();
    const admin = { from: () => ({ insert }) } as never;

    await insertImmediateForRecipients(admin, {
      tenantId: "t1",
      eventId: "e1",
      kind: "event_time_changed",
      eventTitle: "Sync",
      startsAt: "2026-06-01T10:00:00.000Z",
      endsAt: "2026-06-01T11:00:00.000Z",
      timeZone: "Europe/Lisbon",
      recipientUserIds: [],
    });

    expect(insert).not.toHaveBeenCalled();
  });

  it("builds location-changed copy with previous and new location", async () => {
    const insert = vi.fn().mockResolvedValue({ error: null });
    const admin = { from: () => ({ insert }) } as never;

    await insertImmediateForRecipients(admin, {
      tenantId: "t1",
      eventId: "e1",
      kind: "event_location_changed",
      eventTitle: "Town hall",
      startsAt: "2026-06-01T10:00:00.000Z",
      endsAt: "2026-06-01T11:00:00.000Z",
      timeZone: "Europe/Lisbon",
      recipientUserIds: ["u1"],
      location: "Sala B",
      previousLocation: "Sala A",
    });

    const rows = insert.mock.calls[0][0] as { title: string; body: string; kind: string }[];
    expect(rows[0].kind).toBe("event_location_changed");
    expect(rows[0].title).toContain("Local alterado");
    expect(rows[0].body).toContain("Sala B");
    expect(rows[0].body).toContain("Sala A");
  });
});
