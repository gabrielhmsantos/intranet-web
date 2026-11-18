import { describe, expect, it } from "vitest";
import { RenewBootstrapError } from "@/lib/platform/renew-bootstrap";

describe("RenewBootstrapError", () => {
  it("carries HTTP status", () => {
    const err = new RenewBootstrapError("not found", 404);
    expect(err.status).toBe(404);
  });
});
