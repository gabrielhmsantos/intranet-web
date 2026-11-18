import { describe, expect, it } from "vitest";
import { cutoff90dIso, formatBadgeCount } from "@/lib/notifications/format";

describe("formatBadgeCount", () => {
  it("shows exact count up to 99", () => {
    expect(formatBadgeCount(5)).toBe("5");
    expect(formatBadgeCount(99)).toBe("99");
  });

  it('shows "99+" above 99', () => {
    expect(formatBadgeCount(100)).toBe("99+");
    expect(formatBadgeCount(150)).toBe("99+");
  });
});

describe("cutoff90dIso", () => {
  it("returns an ISO string in the past", () => {
    const now = new Date("2026-06-15T12:00:00.000Z");
    const cutoff = cutoff90dIso("Europe/Lisbon", now);
    expect(cutoff).toMatch(/^\d{4}-\d{2}-\d{2}T/);
    expect(new Date(cutoff).getTime()).toBeLessThan(now.getTime());
  });
});
