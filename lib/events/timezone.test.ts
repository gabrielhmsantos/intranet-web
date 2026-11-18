import { describe, expect, it } from "vitest";
import {
  formatEventDateTime,
  instantEquals,
  tenantLocalInputToUtcIso,
  utcToTenantLocalInput,
} from "@/lib/events/timezone";

describe("timezone helpers", () => {
  it("round-trips Lisbon wall time", () => {
    const utc = tenantLocalInputToUtcIso("2026-06-15T14:30", "Europe/Lisbon");
    const back = utcToTenantLocalInput(utc, "Europe/Lisbon");
    expect(back).toBe("2026-06-15T14:30");
  });

  it("formats for display", () => {
    const label = formatEventDateTime("2026-06-15T13:30:00.000Z", "Europe/Lisbon");
    expect(label.length).toBeGreaterThan(5);
  });

  it("instantEquals treats +00:00 and Z as the same instant", () => {
    expect(instantEquals("2026-06-15T09:00:00+00:00", "2026-06-15T09:00:00.000Z")).toBe(true);
  });
});
