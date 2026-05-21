import { describe, expect, it } from "vitest";
import { maskEmail } from "@/lib/email-mask";

describe("maskEmail", () => {
  it("masks local part", () => {
    expect(maskEmail("nome@empresa.pt")).toBe("n***@empresa.pt");
  });
});
