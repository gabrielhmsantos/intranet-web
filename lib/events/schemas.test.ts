import { describe, expect, it } from "vitest";
import {
  createEventBodySchema,
  listEventsQuerySchema,
  managerCreateEventBodySchema,
} from "@/lib/events/schemas";

describe("listEventsQuerySchema", () => {
  it("parses q and pagination defaults", () => {
    const parsed = listEventsQuerySchema.parse({ q: "reunião" });
    expect(parsed.q).toBe("reunião");
    expect(parsed.page).toBe(1);
    expect(parsed.pageSize).toBe(20);
  });
});

describe("createEventBodySchema", () => {
  const base = {
    title: "All hands",
    startsAt: "2026-06-01T10:00:00.000Z",
    endsAt: "2026-06-01T11:00:00.000Z",
    audience: { type: "company" as const },
  };

  it("rejects end before start", () => {
    const result = createEventBodySchema.safeParse({
      ...base,
      endsAt: "2026-06-01T09:00:00.000Z",
    });
    expect(result.success).toBe(false);
  });

  it("accepts end equal to start", () => {
    const result = createEventBodySchema.safeParse({
      ...base,
      endsAt: base.startsAt,
    });
    expect(result.success).toBe(true);
  });

  it("rejects more than 50 employees", () => {
    const employeeIds = Array.from({ length: 51 }, (_, i) =>
      `00000000-0000-4000-8000-${String(i).padStart(12, "0")}`,
    );
    const result = createEventBodySchema.safeParse({
      ...base,
      audience: { type: "employees", employeeIds },
    });
    expect(result.success).toBe(false);
  });

  it("requires departmentId for department audience", () => {
    const result = createEventBodySchema.safeParse({
      ...base,
      audience: { type: "department" },
    });
    expect(result.success).toBe(false);
  });

  it("managerCreateEventBodySchema rejects company audience", () => {
    const result = managerCreateEventBodySchema.safeParse(base);
    expect(result.success).toBe(false);
  });
});
