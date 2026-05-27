import { describe, expect, it } from "vitest";
import { getCivilWeekRangeUtc } from "@/lib/dashboard/week-range";
import { instantEquals } from "@/lib/events/timezone";

describe("getCivilWeekRangeUtc", () => {
  it("returns Monday start and Sunday end for a Wednesday in Lisbon", () => {
    const ref = new Date("2026-05-27T12:00:00.000Z");
    const { weekStartUtc, weekEndUtc } = getCivilWeekRangeUtc("Europe/Lisbon", ref);

    expect(weekStartUtc < weekEndUtc).toBe(true);
    expect(instantEquals(weekStartUtc, weekStartUtc)).toBe(true);

    const startLocal = new Intl.DateTimeFormat("en-US", {
      timeZone: "Europe/Lisbon",
      weekday: "short",
    }).format(new Date(weekStartUtc));
    expect(startLocal.startsWith("Mon")).toBe(true);
  });

  it("week range contains ref instant when ref is mid-week", () => {
    const ref = new Date("2026-05-27T15:00:00.000Z");
    const { weekStartUtc, weekEndUtc } = getCivilWeekRangeUtc("Europe/Lisbon", ref);
    expect(new Date(weekStartUtc).getTime()).toBeLessThanOrEqual(ref.getTime());
    expect(new Date(weekEndUtc).getTime()).toBeGreaterThanOrEqual(ref.getTime());
  });
});
