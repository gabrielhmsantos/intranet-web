import { describe, expect, it } from "vitest";
import {
  EmailAlreadyRegisteredError,
  ProvisionValidationError,
  validateProvisionInput,
} from "@/lib/platform/provision-tenant";

describe("validateProvisionInput", () => {
  it("rejects empty company name", () => {
    expect(() =>
      validateProvisionInput({
        companyName: "   ",
        adminEmail: "a@b.pt",
        createdByUserId: "u1",
      }),
    ).toThrow(ProvisionValidationError);
  });

  it("rejects invalid email", () => {
    expect(() =>
      validateProvisionInput({
        companyName: "Acme",
        adminEmail: "not-an-email",
        createdByUserId: "u1",
      }),
    ).toThrow(ProvisionValidationError);
  });

  it("normalizes valid email", () => {
    const result = validateProvisionInput({
      companyName: "Acme",
      adminEmail: " Admin@Nova.PT ",
      createdByUserId: "u1",
    });
    expect(result.adminEmail).toBe("admin@nova.pt");
  });
});

describe("EmailAlreadyRegisteredError", () => {
  it("has stable name", () => {
    expect(new EmailAlreadyRegisteredError().name).toBe(
      "EmailAlreadyRegisteredError",
    );
  });
});
