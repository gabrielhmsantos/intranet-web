import { describe, expect, it } from "vitest";
import { countPendingInvites } from "@/lib/platform/pending-invites-count";

describe("countPendingInvites", () => {
  it("dedupes employee without account and pending invite for same id", () => {
    expect(
      countPendingInvites(["e1", "e2"], ["e2", "e3"]),
    ).toBe(3);
  });

  it("returns zero for empty inputs", () => {
    expect(countPendingInvites([], [])).toBe(0);
  });
});
