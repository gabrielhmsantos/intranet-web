import { describe, expect, it } from "vitest";
import { validatePassword } from "@/lib/password-policy";

describe("validatePassword", () => {
  it("accepts valid password", () => {
    expect(validatePassword("Teste1234").ok).toBe(true);
  });

  it("rejects short password", () => {
    expect(validatePassword("Te1").ok).toBe(false);
  });

  it("rejects without letter", () => {
    expect(validatePassword("12345678").ok).toBe(false);
  });

  it("rejects without digit", () => {
    expect(validatePassword("Testetest").ok).toBe(false);
  });
});
