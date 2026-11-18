import { describe, expect, it } from "vitest";
import { resolveRecipientUserIds } from "@/lib/events/audience";
import { MAX_SELECTED_EMPLOYEES } from "@/lib/events/schemas";

function mockSupabase(rows: { user_id: string | null }[]) {
  const chain = {
    eq: () => chain,
    not: () => chain,
    in: () => chain,
    select: () => chain,
    then: undefined as unknown,
  };
  const promise = Promise.resolve({ data: rows, error: null });
  Object.assign(chain, {
    then: promise.then.bind(promise),
    catch: promise.catch.bind(promise),
    finally: promise.finally.bind(promise),
  });
  return {
    from: () => chain,
  } as never;
}

describe("resolveRecipientUserIds", () => {
  it("excludes employees without account", async () => {
    const supabase = mockSupabase([
      { user_id: "u1" },
      { user_id: null },
      { user_id: "u2" },
    ]);

    const ids = await resolveRecipientUserIds(supabase, "tenant-1", {
      type: "company",
    });

    expect(ids).toEqual(["u1", "u2"]);
  });

  it("caps selected employees at 50", () => {
    expect(MAX_SELECTED_EMPLOYEES).toBe(50);
  });
});

describe("audience limits in schema", () => {
  it("documents max selected employees", () => {
    expect(MAX_SELECTED_EMPLOYEES).toBe(50);
  });
});
