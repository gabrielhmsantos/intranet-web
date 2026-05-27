import { describe, expect, it } from "vitest";
import { DeleteBootstrapError } from "@/lib/platform/delete-bootstrap";

describe("DeleteBootstrapError", () => {
  it("carries HTTP status", () => {
    const err = new DeleteBootstrapError("blocked", 409);
    expect(err.status).toBe(409);
    expect(err.message).toBe("blocked");
  });
});
